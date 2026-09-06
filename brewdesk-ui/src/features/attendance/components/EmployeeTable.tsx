'use client'

import { UserCircle2 } from 'lucide-react'
import { Employee } from '@/types/attendance'
import { formatAttendanceDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'

interface EmployeeTableProps {
  employees: Employee[] | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  onAddEmployee: () => void
}

const SKELETON_ROWS = 5

export function EmployeeTable({
  employees,
  isLoading,
  error,
  onRetry,
  onAddEmployee,
}: EmployeeTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Employee</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="hidden md:table-cell">Shift</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <ErrorState message={error.message || 'Failed to load employees.'} onRetry={onRetry} />
      </div>
    )
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={UserCircle2}
          title="No employees yet"
          description="Create your first employee profile to start tracking attendance."
          action={{ label: 'Add Employee', onClick: onAddEmployee }}
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Employee</TableHead>
            <TableHead className="hidden sm:table-cell">Department</TableHead>
            <TableHead className="hidden md:table-cell">Shift</TableHead>
            <TableHead className="hidden lg:table-cell">Joined</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm font-mono">{employee.employeeCode}</p>
                    {employee.designation && (
                      <p className="text-xs text-muted-foreground">{employee.designation}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {employee.departmentName ? (
                  <span className="text-sm">{employee.departmentName}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {employee.shiftName ? (
                  <Badge variant="secondary" className="font-normal text-xs">
                    {employee.shiftName}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {employee.joiningDate ? formatAttendanceDate(employee.joiningDate) : '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={employee.active ? 'default' : 'secondary'}
                  className={
                    employee.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 text-xs'
                      : 'text-xs'
                  }
                >
                  {employee.active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
