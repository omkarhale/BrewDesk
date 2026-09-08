"use client";
import { useState } from "react";
import { Plus, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeesQuery } from "@/hooks/useEmployeeManagement";
import { useShiftsQuery } from "@/hooks/useShiftManagement";
import { useDepartmentsQuery } from "@/hooks/useDepartmentManagement";
import { useUsers } from "@/hooks/useUsers";
import { isManagement } from "@/types/auth";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/features/attendance/components/EmployeeTable";
import { EmployeeFormDialog } from "@/features/attendance/components/EmployeeFormDialog";

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = isManagement(user?.role);
  const { data: employees, isLoading, error, refetch } = useEmployeesQuery();
  const { data: shifts = [] } = useShiftsQuery();
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: users = [] } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <UserCircle2 className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
      <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage employees.</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight" style={{fontFamily:"var(--font-display)"}}>Employees</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Manage employee profiles, shift assignments, and department membership.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 h-8 text-[13px]">
          <Plus className="h-3.5 w-3.5" />Add Employee
        </Button>
      </div>

      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        error={error ? new Error(getErrorMessage(error)) : null}
        onRetry={() => refetch()}
        onAddEmployee={() => setDialogOpen(true)}
        onRefetch={() => refetch()}
        shifts={shifts}
        departments={departments}
      />

      <EmployeeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => refetch()} users={users} departments={departments} shifts={shifts} />
    </div>
  );
}
