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
import { useUpdateDepartment } from "@/hooks/useDepartmentManagement";
import { Department } from "@/types/attendance";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  code: z.string().trim().min(1, "Code is required").max(50).regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, hyphens, underscores only"),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  onSuccess: () => void;
}

export function EditDepartmentDialog({ open, onOpenChange, department, onSuccess }: Props) {
  const mutation = useUpdateDepartment();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: department.name, code: department.code, active: department.active },
  });

  useEffect(() => {
    if (open) reset({ name: department.name, code: department.code, active: department.active });
  }, [open, department, reset]);

  const activeVal = watch("active");

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync({ id: department.id, request: { name: values.name.trim(), code: values.code.trim().toUpperCase(), active: values.active } });
      onOpenChange(false);
      onSuccess();
    } catch { /* toast handled in hook */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department name, code, or status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-dept-name">Department Name</Label>
            <Input id="edit-dept-name" autoComplete="off" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-dept-code">Department Code</Label>
            <Input id="edit-dept-code" autoComplete="off" className="uppercase" {...register("code")} />
            {errors.code && <p className="text-xs text-destructive" role="alert">{errors.code.message}</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-[13px] font-medium">Active</p>
              <p className="text-[12px] text-muted-foreground">Inactive departments cannot be assigned to employees</p>
            </div>
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
