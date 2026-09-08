import { cn } from '@/lib/utils'
import { AttendanceStatus } from '@/types/attendance'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  /** Show a leading dot indicator (Rippling-style) */
  withDot?: boolean
  className?: string
}

// ── Status config — Rippling pill aesthetic ───────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; pill: string; dot: string }
> = {
  PRESENT:    {
    label: 'Present',
    pill:  'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
    dot:   'bg-teal-500',
  },
  ABSENT:     {
    label: 'Absent',
    pill:  'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    dot:   'bg-red-500',
  },
  HALF_DAY:   {
    label: 'Half Day',
    pill:  'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    dot:   'bg-amber-500',
  },
  INCOMPLETE: {
    label: 'Incomplete',
    pill:  'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    dot:   'bg-orange-500',
  },
  WEEK_OFF:   {
    label: 'Week Off',
    pill:  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    dot:   'bg-slate-400',
  },
  HOLIDAY:    {
    label: 'Holiday',
    pill:  'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    dot:   'bg-blue-500',
  },
  ON_LEAVE:   {
    label: 'On Leave',
    pill:  'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    dot:   'bg-purple-500',
  },
}

export function AttendanceStatusBadge({
  status,
  withDot = true,
  className,
}: AttendanceStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap select-none',
        cfg.pill,
        className,
      )}
    >
      {withDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      )}
      {cfg.label}
    </span>
  )
}
