"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateShift } from "@/hooks/useShiftManagement";
import { Shift } from "@/types/attendance";
import { isOvernightShift } from "@/lib/utils";

const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  startTime: z.string().regex(timeRe, "HH:MM format"),
  endTime: z.string().regex(timeRe, "HH:MM format"),
  breakMinutes: z.number().int().min(0).max(480),
  graceMinutes: z.number().int().min(0).max(120),
  minimumWorkMinutes: z.number().int().min(0).max(1440),
  halfDayMinutes: z.number().int().min(0).max(720),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function toHHMM(t: string) { return t ? t.substring(0, 5) : ""; }

interface Props { open: boolean; onOpenChange: (v: boolean) => void; shift: Shift; onSuccess: () => void; }

export function EditShiftDialog({ open, onOpenChange, shift, onSuccess }: Props) {
  const mutation = useUpdateShift();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: shift.name, startTime: toHHMM(shift.startTime), endTime: toHHMM(shift.endTime),
      breakMinutes: shift.breakMinutes, graceMinutes: shift.graceMinutes,
      minimumWorkMinutes: shift.minimumWorkMinutes, halfDayMinutes: shift.halfDayMinutes,
      active: shift.active,
    },
  });
  useEffect(() => {
    if (open) reset({
      name: shift.name, startTime: toHHMM(shift.startTime), endTime: toHHMM(shift.endTime),
      breakMinutes: shift.breakMinutes, graceMinutes: shift.graceMinutes,
      minimumWorkMinutes: shift.minimumWorkMinutes, halfDayMinutes: shift.halfDayMinutes,
      active: shift.active,
    });
  }, [open, shift, reset]);

  const [st, et, activeVal] = [watch("startTime"), watch("endTime"), watch("active")];
  const overnight = st && et && timeRe.test(st) && timeRe.test(et) ? isOvernightShift(st + ":00", et + ":00") : false;

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync({ id: shift.id, request: {
        name: values.name.trim(), startTime: values.startTime + ":00", endTime: values.endTime + ":00",
        breakMinutes: values.breakMinutes, graceMinutes: values.graceMinutes,
        minimumWorkMinutes: values.minimumWorkMinutes, halfDayMinutes: values.halfDayMinutes, active: values.active,
      }});
      onOpenChange(false); onSuccess();
    } catch {}
  };

  const numField = (id: string, label: string, field: keyof FormValues, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} autoComplete="off"
        {...register(field as any, { valueAsNumber: true })}
        onChange={(e) => { const v = e.target.value; (register(field as any).onChange as any)({ target: { value: v === "" ? "" : Number(v) } }); }}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {errors[field] && <p className="text-xs text-destructive">{(errors[field] as any).message}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit Shift</DialogTitle><DialogDescription>Update shift hours, thresholds, and status.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-shift-name">Shift Name</Label>
            <Input id="edit-shift-name" autoComplete="off" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="edit-shift-start">Start Time</Label><Input id="edit-shift-start" type="time" {...register("startTime")} /></div>
            <div className="space-y-1.5"><Label htmlFor="edit-shift-end">End Time</Label><Input id="edit-shift-end" type="time" {...register("endTime")} /></div>
          </div>
          {overnight && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 px-3 py-2">
              <Moon className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Overnight shift — end is next calendar day</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {numField("edit-grace","Grace Minutes","graceMinutes","Late arrival tolerance")}
            {numField("edit-break","Break Minutes","breakMinutes","Reference only")}
            {numField("edit-minwork","Min Work Minutes","minimumWorkMinutes","Required for PRESENT")}
            {numField("edit-halfday","Half Day Minutes","halfDayMinutes","Threshold for HALF_DAY")}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div><p className="text-[13px] font-medium">Active</p><p className="text-[12px] text-muted-foreground">Inactive shifts cannot be assigned</p></div>
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
