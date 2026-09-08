"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateEmployee } from "@/hooks/useEmployeeManagement";
import { Department, Employee, Shift } from "@/types/attendance";

const schema = z.object({
  shiftId: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().trim().max(100).optional().or(z.literal("")),
  joiningDate: z.string().min(1, "Joining date is required").regex(/^\d{4}-\d{2}-\d{2}$/),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: Employee;
  shifts: Shift[];
  departments: Department[];
  onSuccess: () => void;
}

export function EditEmployeeDialog({ open, onOpenChange, employee, shifts, departments, onSuccess }: Props) {
  const mutation = useUpdateEmployee();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      shiftId: employee.shiftId ? String(employee.shiftId) : "__none",
      departmentId: employee.departmentId ? String(employee.departmentId) : "__none",
      designation: employee.designation ?? "",
      joiningDate: employee.joiningDate,
      active: employee.active,
    },
  });
  useEffect(() => {
    if (open) reset({
      shiftId: employee.shiftId ? String(employee.shiftId) : "__none",
      departmentId: employee.departmentId ? String(employee.departmentId) : "__none",
      designation: employee.designation ?? "",
      joiningDate: employee.joiningDate,
      active: employee.active,
    });
  }, [open, employee, reset]);

  const activeVal = watch("active");
  const shiftVal = watch("shiftId");
  const deptVal = watch("departmentId");

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync({ id: employee.id, request: {
        shiftId: values.shiftId && values.shiftId !== "__none" ? Number(values.shiftId) : null,
        departmentId: values.departmentId && values.departmentId !== "__none" ? Number(values.departmentId) : null,
        designation: values.designation || undefined,
        joiningDate: values.joiningDate,
        active: values.active,
      }});
      onOpenChange(false); onSuccess();
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update profile for <span className="font-mono font-semibold">{employee.employeeCode}</span></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={deptVal} onValueChange={(v) => setValue("departmentId", v)}>
              <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No department</SelectItem>
                {departments.filter(d => d.active).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Shift</Label>
            <Select value={shiftVal} onValueChange={(v) => setValue("shiftId", v)}>
              <SelectTrigger><SelectValue placeholder="No shift" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No shift</SelectItem>
                {shifts.filter(s => s.active).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-emp-desig">Designation</Label>
            <Input id="edit-emp-desig" placeholder="e.g., Software Engineer" autoComplete="off" {...register("designation")} />
            {errors.designation && <p className="text-xs text-destructive">{errors.designation.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-emp-join">Joining Date</Label>
            <Input id="edit-emp-join" type="date" {...register("joiningDate")} />
            {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div><p className="text-[13px] font-medium">Active</p><p className="text-[12px] text-muted-foreground">Inactive employees cannot punch in</p></div>
            <Switch checked={activeVal} onCheckedChange={(v) => setValue("active", v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
