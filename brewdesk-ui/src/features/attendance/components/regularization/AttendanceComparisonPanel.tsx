'use client'

import { cn, formatAttendanceTime, formatWorkMinutes } from '@/lib/utils'
import { AttendanceCalculationResponse, RegularizationRequestResponse } from '@/types/attendance'
import { AttendanceStatusBadge } from '../AttendanceStatusBadge'

interface Props {
  request: RegularizationRequestResponse
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className={cn('text-[13px] font-medium tabular-nums', className)}>{value}</span>
    </div>
  )
}

function AttendancePanel({ title, rec, colorClass }: {
  title: string
  rec: AttendanceCalculationResponse | null
  colorClass: string
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className={cn('text-[11px] font-semibold uppercase tracking-wider mb-2', colorClass)}>
        {title}
      </p>
      {rec ? (
        <div className="card-flat p-3 space-y-0">
          <div className="py-1.5 border-b border-border flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Status</span>
            <AttendanceStatusBadge status={rec.status} />
          </div>
          <Row label="First In"    value={formatAttendanceTime(rec.firstIn)} />
          <Row label="Last Out"    value={formatAttendanceTime(rec.lastOut)} />
          <Row label="Total Work"  value={formatWorkMinutes(rec.totalWorkMinutes)} />
          {rec.lateMinutes > 0 && (
            <Row label="Late" value={`${rec.lateMinutes} min`} className="text-amber-600" />
          )}
        </div>
      ) : (
        <div className="card-flat p-3 text-[12px] text-muted-foreground">
          No attendance record
        </div>
      )}
    </div>
  )
}

function RequestedPanel({ request }: { request: RegularizationRequestResponse }) {
  const punchIn  = request.requestedPunchIn
  const punchOut = request.requestedPunchOut

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 text-teal-600 dark:text-teal-400">
        Requested
      </p>
      <div className="card-flat p-3 space-y-0">
        <div className="py-1.5 border-b border-border flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">Type</span>
          <span className="text-[13px] font-medium">{request.type.replace(/_/g, ' ')}</span>
        </div>
        {punchIn && (
          <Row label="Punch In"  value={formatAttendanceTime(punchIn)} />
        )}
        {punchOut && (
          <Row label="Punch Out" value={formatAttendanceTime(punchOut)} />
        )}
        {request.halfDayType && (
          <>
            <Row
              label="Half Day"
              value={request.halfDayType.replace('_', ' ')}
            />
            <p className="pt-1 text-[11px] text-muted-foreground leading-snug">
              Punch times will be derived from your configured shift window on
              approval.
            </p>
          </>
        )}
        {!punchIn && !punchOut && !request.halfDayType && (
          <p className="text-[12px] text-muted-foreground py-1.5">
            See request reason for details.
          </p>
        )}
      </div>
    </div>
  )
}

export function AttendanceComparisonPanel({ request }: Props) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-foreground mb-3"
        style={{ fontFamily: 'var(--font-display)' }}>
        Attendance Comparison
      </p>
      <div className="flex gap-3 items-start">
        <AttendancePanel
          title="Current"
          rec={request.currentAttendance}
          colorClass="text-slate-500"
        />
        <div className="mt-6 text-muted-foreground/30 text-xl shrink-0">→</div>
        <RequestedPanel request={request} />
      </div>
    </div>
  )
}
