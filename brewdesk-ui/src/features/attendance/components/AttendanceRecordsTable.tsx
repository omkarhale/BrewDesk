'use client'

import { ClipboardList } from 'lucide-react'
import { AttendanceCalculationResponse } from '@/types/attendance'
import {
  formatAttendanceDate,
  formatAttendanceTime,
  formatWorkMinutes,
  formatLateMinutes,
} from '@/lib/utils'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
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

interface AttendanceRecordsTableProps {
  records: AttendanceCalculationResponse[] | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  onRetry: () => void
}

const SKELETON_ROWS = 8

export function AttendanceRecordsTable({
  records,
  isLoading,
  isFetching,
  error,
  onRetry,
}: AttendanceRecordsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden sm:table-cell">Shift</TableHead>
              <TableHead className="hidden md:table-cell">First In</TableHead>
              <TableHead className="hidden md:table-cell">Last Out</TableHead>
              <TableHead className="hidden lg:table-cell">Work</TableHead>
              <TableHead className="hidden lg:table-cell">Late</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-14" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-14" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
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
        <ErrorState
          message={error.message || 'Failed to load attendance records.'}
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={ClipboardList}
          title="No records found"
          description="No attendance records match your current filters. Try adjusting the date range or clearing the filters."
        />
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="hidden sm:table-cell">Shift</TableHead>
            <TableHead className="hidden md:table-cell">First In</TableHead>
            <TableHead className="hidden md:table-cell">Last Out</TableHead>
            <TableHead className="hidden lg:table-cell">Work</TableHead>
            <TableHead className="hidden lg:table-cell">Late</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={`${record.employeeCode}-${record.attendanceDate}`}>
              <TableCell>
                <span className="font-mono text-sm font-semibold">{record.employeeCode}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatAttendanceDate(record.attendanceDate)}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary" className="font-normal text-xs">
                  {record.shiftName}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm font-mono">
                  {formatAttendanceTime(record.firstIn)}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm font-mono">
                  {formatAttendanceTime(record.lastOut)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-sm font-medium">
                  {formatWorkMinutes(record.totalWorkMinutes)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {record.lateMinutes > 0 ? (
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    {formatLateMinutes(record.lateMinutes)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <AttendanceStatusBadge status={record.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
