'use client'

import { Clock } from 'lucide-react'
import { Shift } from '@/types/attendance'
import { formatShiftTime, isOvernightShift } from '@/lib/utils'
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

interface ShiftTableProps {
  shifts: Shift[] | undefined
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  onAddShift: () => void
}

const SKELETON_ROWS = 4

function MinutesCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value > 0 ? `${value} min` : <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  )
}

export function ShiftTable({ shifts, isLoading, error, onRetry, onAddShift }: ShiftTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Shift</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead className="hidden md:table-cell">Grace</TableHead>
              <TableHead className="hidden md:table-cell">Min Work</TableHead>
              <TableHead className="hidden lg:table-cell">Half Day</TableHead>
              <TableHead className="hidden lg:table-cell">Break</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
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
        <ErrorState message={error.message || 'Failed to load shifts.'} onRetry={onRetry} />
      </div>
    )
  }

  if (!shifts || shifts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={Clock}
          title="No shifts yet"
          description="Create your first shift to define working hours, grace periods, and minimum work requirements."
          action={{ label: 'Add Shift', onClick: onAddShift }}
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Shift</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead className="hidden md:table-cell">Grace</TableHead>
            <TableHead className="hidden md:table-cell">Min Work</TableHead>
            <TableHead className="hidden lg:table-cell">Half Day</TableHead>
            <TableHead className="hidden lg:table-cell">Break</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => {
            const overnight = isOvernightShift(shift.startTime, shift.endTime)
            return (
              <TableRow key={shift.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                      <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{shift.name}</p>
                      {overnight && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 mt-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        >
                          Overnight
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatShiftTime(shift.startTime, shift.endTime)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <MinutesCell label="Grace" value={shift.graceMinutes} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <MinutesCell label="Min Work" value={shift.minimumWorkMinutes} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <MinutesCell label="Half Day" value={shift.halfDayMinutes} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <MinutesCell label="Break" value={shift.breakMinutes} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
