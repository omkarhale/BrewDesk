"use client";
import { useState } from "react";
import { Clock, Moon, Pencil, Trash2 } from "lucide-react";
import { Shift } from "@/types/attendance";
import { cn, formatShiftTime, isOvernightShift } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EditShiftDialog } from "./EditShiftDialog";
import { useDeleteShift } from "@/hooks/useShiftManagement";

interface Props {
  shifts: Shift[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onAddShift: () => void;
  onRefetch: () => void;
}

const TH = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn("px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>{children}</th>
);

function DeleteShiftDialog({ shift, onCancel }: { shift: Shift; onCancel: () => void }) {
  const mutation = useDeleteShift();
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Delete Shift</DialogTitle><DialogDescription>Delete <span className="font-semibold">{shift.name}</span>? Employees currently on this shift will lose their assignment.</DialogDescription></DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
          <Button variant="destructive" disabled={mutation.isPending} onClick={async () => { try { await mutation.mutateAsync(shift.id); onCancel(); } catch {} }}>
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MinuteCell({ value }: { value: number }) {
  return value > 0 ? <span className="text-[12px] font-medium">{value}m</span> : <span className="text-muted-foreground/40 text-[12px]">—</span>;
}

export function ShiftTable({ shifts, isLoading, error, onRetry, onAddShift, onRefetch }: Props) {
  const [editTarget, setEditTarget] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  if (isLoading) return (
    <div className="card-flat overflow-hidden">
      <table className="w-full">
        <thead><tr className="table-header-rippling"><TH>Shift</TH><TH>Hours</TH><TH className="hidden md:table-cell">Grace</TH><TH className="hidden md:table-cell">Min Work</TH><TH className="hidden lg:table-cell">Half Day</TH><TH className="w-20">&nbsp;</TH></tr></thead>
        <tbody>{Array.from({length:4}).map((_,i)=>(
          <tr key={i} className="border-t border-border">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg"/><Skeleton className="h-4 w-28"/></div></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-28"/></td>
            <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-14"/></td>
            <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-14"/></td>
            <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-14"/></td>
            <td className="px-4 py-3"><Skeleton className="h-7 w-16"/></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
  if (error) return <div className="card-flat"><ErrorState message={error.message} onRetry={onRetry} /></div>;
  if (!shifts || shifts.length === 0) return (
    <div className="card-flat"><EmptyState icon={Clock} title="No shifts yet" description="Create your first shift to define working hours and attendance thresholds." action={{ label: "Add Shift", onClick: onAddShift }} /></div>
  );

  return (
    <>
      <div className="card-flat overflow-hidden">
        <table className="w-full">
          <thead><tr className="table-header-rippling">
            <TH>Shift</TH><TH>Hours</TH><TH className="hidden md:table-cell">Grace</TH><TH className="hidden md:table-cell">Min Work</TH><TH className="hidden lg:table-cell">Half Day</TH><TH className="hidden lg:table-cell">Break</TH><TH className="w-20">&nbsp;</TH>
          </tr></thead>
          <tbody>
            {shifts.map(s => {
              const overnight = isOvernightShift(s.startTime, s.endTime);
              return (
                <tr key={s.id} className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                        <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{s.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {!s.active && <span className="text-[10px] text-slate-400 font-medium">Inactive</span>}
                          {overnight && <span className="flex items-center gap-0.5 text-[10px] text-amber-600"><Moon className="h-2.5 w-2.5"/>Overnight</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="font-mono text-[12px] text-muted-foreground">{formatShiftTime(s.startTime, s.endTime)}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><MinuteCell value={s.graceMinutes} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><MinuteCell value={s.minimumWorkMinutes} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><MinuteCell value={s.halfDayMinutes} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><MinuteCell value={s.breakMinutes} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setEditTarget(s)} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-teal-50 hover:text-teal-700 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5"/></button>
                      <button type="button" onClick={() => setDeleteTarget(s)} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editTarget && <EditShiftDialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} shift={editTarget} onSuccess={() => { setEditTarget(null); onRefetch(); }} />}
      {deleteTarget && <DeleteShiftDialog shift={deleteTarget} onCancel={() => { setDeleteTarget(null); onRefetch(); }} />}
    </>
  );
}


