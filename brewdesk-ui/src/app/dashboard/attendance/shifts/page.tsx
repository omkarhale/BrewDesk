'use client'

import { useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useShiftsQuery } from '@/hooks/useShiftManagement'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShiftTable } from '@/features/attendance/components/ShiftTable'
import { ShiftFormDialog } from '@/features/attendance/components/ShiftFormDialog'

export default function ShiftsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { data: shifts, isLoading, error, refetch } = useShiftsQuery()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <Clock className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage shifts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Shifts</h2>
          <p className="mt-1 text-muted-foreground">
            Define working hours, grace periods, and attendance thresholds for each shift.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Shift
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ShiftTable
            shifts={shifts}
            isLoading={isLoading}
            error={error ? new Error(getErrorMessage(error)) : null}
            onRetry={() => refetch()}
            onAddShift={() => setDialogOpen(true)}
          />
        </CardContent>
      </Card>

      <ShiftFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
