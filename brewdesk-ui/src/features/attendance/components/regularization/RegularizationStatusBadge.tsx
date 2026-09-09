'use client'

import { cn } from '@/lib/utils'
import { RegularizationStatus } from '@/types/attendance'

const CONFIG: Record<RegularizationStatus, { label: string; pill: string; dot: string }> = {
  PENDING:   { label: 'Pending',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',   dot: 'bg-amber-500' },
  APPROVED:  { label: 'Approved',  pill: 'bg-teal-50  text-teal-700  dark:bg-teal-900/20  dark:text-teal-400',    dot: 'bg-teal-500' },
  REJECTED:  { label: 'Rejected',  pill: 'bg-red-50   text-red-600   dark:bg-red-900/20   dark:text-red-400',     dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', pill: 'bg-slate-100 text-slate-500 dark:bg-slate-800  dark:text-slate-400',    dot: 'bg-slate-400' },
}

export function RegularizationStatusBadge({ status }: { status: RegularizationStatus }) {
  const cfg = CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap select-none',
      cfg.pill,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
