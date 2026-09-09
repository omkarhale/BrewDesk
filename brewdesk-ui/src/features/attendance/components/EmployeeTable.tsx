"use client";
import { useState } from "react";
import { Pencil, Power, UserCircle2 } from "lucide-react";
import { Department, Employee, Shift } from "@/types/attendance";
import { UserResponse } from "@/types/user";
import { cn, formatAttendanceDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { useUpdateEmployee } from "@/hooks/useEmployeeManagement";

interface Props {
  employees: Employee[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onAddEmployee: () => void;
  onRefetch: () => void;
  shifts: Shift[];
  departments: Department[];
  users: UserResponse[];
}

const TH = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn("px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>{children}</th>
);

function ToggleActiveButton({ employee, onDone }: { employee: Employee; onDone: () => void }) {
  const mutation = useUpdateEmployee();
  const handle = async () => {
    try {
      await mutation.mutateAsync({ id: employee.id, request: {
        shiftId: employee.shiftId, departmentId: employee.departmentId,
        designation: employee.designation ?? undefined,
        joiningDate: employee.joiningDate, active: !employee.active,
      }});
      onDone();
    } catch {}
  };
  return (
    <button type="button" onClick={handle} disabled={mutation.isPending}
      className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-colors",
        employee.active ? "text-muted-foreground hover:bg-amber-50 hover:text-amber-600" : "text-muted-foreground hover:bg-teal-50 hover:text-teal-700")}
      title={employee.active ? "Deactivate" : "Activate"}>
      <Power className="h-3.5 w-3.5" />
    </button>
  );
}

export function EmployeeTable({ employees, isLoading, error, onRetry, onAddEmployee, onRefetch, shifts, departments, users }: Props) {
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  if (isLoading) return (
    <div className="card-flat overflow-hidden">
      <table className="w-full">
        <thead><tr className="table-header-rippling"><TH>Employee</TH><TH className="hidden sm:table-cell">Dept</TH><TH className="hidden md:table-cell">Shift</TH><TH className="hidden lg:table-cell">Joined</TH><TH>Status</TH><TH className="w-20">&nbsp;</TH></tr></thead>
        <tbody>{Array.from({length:5}).map((_,i)=>(
          <tr key={i} className="border-t border-border">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-lg"/><div className="space-y-1"><Skeleton className="h-4 w-20"/><Skeleton className="h-3 w-28"/></div></div></td>
            <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-24"/></td>
            <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-5 w-20 rounded-full"/></td>
            <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24"/></td>
            <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full"/></td>
            <td className="px-4 py-3"><Skeleton className="h-7 w-16"/></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
  if (error) return <div className="card-flat"><ErrorState message={error.message} onRetry={onRetry} /></div>;
  if (!employees || employees.length === 0) return (
    <div className="card-flat"><EmptyState icon={UserCircle2} title="No employees yet" description="Create your first employee profile to start tracking attendance." action={{ label: "Add Employee", onClick: onAddEmployee }} /></div>
  );

  return (
    <>
      <div className="card-flat overflow-hidden">
        <table className="w-full">
          <thead><tr className="table-header-rippling">
            <TH>Employee</TH><TH className="hidden sm:table-cell">Department</TH><TH className="hidden md:table-cell">Shift</TH><TH className="hidden lg:table-cell">Joined</TH><TH>Status</TH><TH className="hidden lg:table-cell">Action</TH>
          </tr></thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id} className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{users.find(user => user.id === e.userId)?.name ?? <span className="text-muted-foreground/40">—</span>}</p>
                      <p className="font-mono text-[12px] font-semibold">{e.employeeCode}</p>
                      {e.designation && <p className="text-[11px] text-muted-foreground">{e.designation}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-[13px]">{e.departmentName ?? <span className="text-muted-foreground/40">—</span>}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {e.shiftName ? <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{e.shiftName}</span> : <span className="text-muted-foreground/40 text-[12px]">—</span>}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-[13px] text-muted-foreground">{formatAttendanceDate(e.joiningDate)}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", e.active ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", e.active ? "bg-teal-500" : "bg-slate-400")} />
                    {e.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditTarget(e)} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-teal-50 hover:text-teal-700 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5"/></button>
                    <ToggleActiveButton employee={e} onDone={onRefetch} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editTarget && (
        <EditEmployeeDialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} employee={editTarget} shifts={shifts} departments={departments} onSuccess={() => { setEditTarget(null); onRefetch(); }} />
      )}
    </>
  );
}


