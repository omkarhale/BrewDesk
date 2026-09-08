"use client";
import { useState } from "react";
import { Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useShiftsQuery } from "@/hooks/useShiftManagement";
import { isManagement } from "@/types/auth";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShiftTable } from "@/features/attendance/components/ShiftTable";
import { ShiftFormDialog } from "@/features/attendance/components/ShiftFormDialog";

export default function ShiftsPage() {
  const { user } = useAuth();
  const isAdmin = isManagement(user?.role);
  const { data: shifts, isLoading, error, refetch } = useShiftsQuery();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <Clock className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
      <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage shifts.</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight" style={{fontFamily:"var(--font-display)"}}>Shifts</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Define working hours, grace periods, and attendance thresholds for each shift.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 h-8 text-[13px]">
          <Plus className="h-3.5 w-3.5" />Add Shift
        </Button>
      </div>

      <ShiftTable
        shifts={shifts}
        isLoading={isLoading}
        error={error ? new Error(getErrorMessage(error)) : null}
        onRetry={() => refetch()}
        onAddShift={() => setDialogOpen(true)}
        onRefetch={() => refetch()}
      />

      <ShiftFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => refetch()} />
    </div>
  );
}
