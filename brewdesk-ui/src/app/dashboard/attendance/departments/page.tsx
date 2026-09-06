'use client'

import { useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDepartmentsQuery } from '@/hooks/useDepartmentManagement'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DepartmentTable } from '@/features/attendance/components/DepartmentTable'
import { DepartmentFormDialog } from '@/features/attendance/components/DepartmentFormDialog'

export default function DepartmentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { data: departments, isLoading, error, refetch } = useDepartmentsQuery()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <Building2 className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage departments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Departments</h2>
          <p className="mt-1 text-muted-foreground">
            Manage organizational departments for employee assignment and reporting.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DepartmentTable
            departments={departments}
            isLoading={isLoading}
            error={error ? new Error(getErrorMessage(error)) : null}
            onRetry={() => refetch()}
            onAddDepartment={() => setDialogOpen(true)}
          />
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
