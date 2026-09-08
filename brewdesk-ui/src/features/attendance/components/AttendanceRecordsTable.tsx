'use client'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { cn, formatAttendanceDate, formatAttendanceTime, formatLateMinutes, formatWorkMinutes } from '@/lib/utils'
import { AttendanceCalculationResponse } from '@/types/attendance'
import { ClipboardList } from 'lucide-react'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'

interface AttendanceRecordsTableProps {
  records:    AttendanceCalculationResponse[] | undefined
  isLoading:  boolean
  isFetching: boolean
  error:      Error | null
  onRetry:    () => void
}

const SKELETON_ROWS = 8

// ── Column definition ─────────────────────────────────────────────────────────

const TH = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => (
  <th
    className={cn(
      'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap',
      className,
    )}
  >
    {children}
  </th>
)

const TD = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => (
  <td className={cn('px-4 py-3 text-[13px]', className)}>
    {children}
  </td>
)

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      <TD><div className="h-3.5 w-20 rounded bg-muted animate-pulse" /></TD>
      <TD><div className="h-3.5 w-24 rounded bg-muted animate-pulse" /></TD>
      <TD className="hidden sm:table-cell"><div className="h-3.5 w-20 rounded bg-muted animate-pulse" /></TD>
      <TD className="hidden md:table-cell"><div className="h-3.5 w-16 rounded bg-muted animate-pulse" /></TD>
      <TD className="hidden md:table-cell"><div className="h-3.5 w-16 rounded bg-muted animate-pulse" /></TD>
      <TD className="hidden lg:table-cell"><div className="h-3.5 w-14 rounded bg-muted animate-pulse" /></TD>
      <TD className="hidden lg:table-cell"><div className="h-3.5 w-14 rounded bg-muted animate-pulse" /></TD>
      <TD><div className="h-5 w-20 rounded-full bg-muted animate-pulse" /></TD>
    </tr>
  )
}

// ── Data row ──────────────────────────────────────────────────────────────────

function DataRow({ record }: { record: AttendanceCalculationResponse }) {
  return (
    <tr className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors duration-75">
      <TD>
        <span className="font-mono text-[12px] font-semibold text-foreground">
          {record.employeeCode}
        </span>
      </TD>
      <TD>
        <span className="text-muted-foreground">
          {formatAttendanceDate(record.attendanceDate)}
        </span>
      </TD>
      <TD className="hidden sm:table-cell">
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {record.shiftName}
        </span>
      </TD>
      <TD className="hidden md:table-cell">
        <span className="font-mono">{formatAttendanceTime(record.firstIn)}</span>
      </TD>
      <TD className="hidden md:table-cell">
        <span className="font-mono">{formatAttendanceTime(record.lastOut)}</span>
      </TD>
      <TD className="hidden lg:table-cell">
        <span className="font-medium">{formatWorkMinutes(record.totalWorkMinutes)}</span>
      </TD>
      <TD className="hidden lg:table-cell">
        {record.lateMinutes > 0 ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {formatLateMinutes(record.lateMinutes)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TD>
      <TD>
        <AttendanceStatusBadge status={record.status} />
      </TD>
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AttendanceRecordsTable({
  records,
  isLoading,
  isFetching,
  error,
  onRetry,
}: AttendanceRecordsTableProps) {

  if (error) {
    return (
      <div className="card-flat">
        <ErrorState
          message={error.message || 'Failed to load attendance records.'}
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (!isLoading && (!records || records.length === 0)) {
    return (
      <div className="card-flat">
        <EmptyState
          icon={ClipboardList}
          title="No records found"
          description="No attendance records match your current filters. Try adjusting the date range or clearing the filters."
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'card-flat overflow-hidden transition-opacity duration-150',
        isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">

          {/* ── Header ── */}
          <thead>
            <tr className="table-header-rippling">
              <TH>Employee</TH>
              <TH>Date</TH>
              <TH className="hidden sm:table-cell">Shift</TH>
              <TH className="hidden md:table-cell">First In</TH>
              <TH className="hidden md:table-cell">Last Out</TH>
              <TH className="hidden lg:table-cell">Work</TH>
              <TH className="hidden lg:table-cell">Late</TH>
              <TH>Status</TH>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => <SkeletonRow key={i} />)
              : records!.map((record) => (
                  <DataRow
                    key={`${record.employeeCode}-${record.attendanceDate}`}
                    record={record}
                  />
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
