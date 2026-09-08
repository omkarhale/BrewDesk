"use client";
import { useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { Department } from "@/types/attendance";
import { formatAttendanceDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EditDepartmentDialog } from "./EditDepartmentDialog";
import { useDeleteDepartment } from "@/hooks/useDepartmentManagement";

interface Props {
  departments: Department[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onAddDepartment: () => void;
  onRefetch: () => void;
}

const TH = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn("px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>{children}</th>
);

function DeleteConfirmDialog({ id, name, onCancel }: { id: number; name: string; onCancel: () => void; onSuccess: () => void }) {
  const mutation = useDeleteDepartment();
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogDescription>Are you sure you want to delete <span className="font-semibold">{name}</span>? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
          <Button variant="destructive" disabled={mutation.isPending}
            onClick={async () => { try { await mutation.mutateAsync(id); onCancel(); } catch {} }}>
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DepartmentTable({ departments, isLoading, error, onRetry, onAddDepartment, onRefetch }: Props) {
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  if (isLoading) return (
    <div className="card-flat overflow-hidden">
      <table className="w-full">
        <thead><tr className="table-header-rippling"><TH>Name</TH><TH>Code</TH><TH className="hidden sm:table-cell">Status</TH><TH className="hidden md:table-cell">Created</TH><TH></TH></tr></thead>
        <tbody>{Array.from({length:5}).map((_,i)=>(
          <tr key={i} className="border-t border-border">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg shrink-0"/><Skeleton className="h-4 w-32"/></div></td>
            <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full"/></td>
            <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-14 rounded-full"/></td>
            <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24"/></td>
            <td className="px-4 py-3"><Skeleton className="h-7 w-16"/></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
  if (error) return <div className="card-flat"><ErrorState message={error.message} onRetry={onRetry} /></div>;
  if (!departments || departments.length === 0) return (
    <div className="card-flat"><EmptyState icon={Building2} title="No departments yet" description="Create your first department to organize employees." action={{ label: "Add Department", onClick: onAddDepartment }} /></div>
  );

  return (
    <>
      <div className="card-flat overflow-hidden">
        <table className="w-full">
          <thead><tr className="table-header-rippling">
            <TH>Name</TH><TH>Code</TH><TH className="hidden sm:table-cell">Status</TH><TH className="hidden md:table-cell">Created</TH><TH className="w-20">&nbsp;</TH>
          </tr></thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id} className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <p className="text-[13px] font-medium">{d.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-semibold text-muted-foreground">{d.code}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", d.active ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", d.active ? "bg-teal-500" : "bg-slate-400")} />
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-[13px] text-muted-foreground">{formatAttendanceDate(d.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditTarget(d)} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-teal-50 hover:text-teal-700 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setDeleteTarget(d)} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditDepartmentDialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} department={editTarget} onSuccess={() => { setEditTarget(null); onRefetch(); }} />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog id={deleteTarget.id} name={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onSuccess={() => { setDeleteTarget(null); onRefetch(); }} />
      )}
    </>
  );
}


