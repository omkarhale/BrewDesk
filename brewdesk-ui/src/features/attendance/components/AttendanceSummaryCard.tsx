import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceSummaryCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  /** Tailwind colour class for the icon background e.g. 'text-teal-600 bg-teal-50' */
  colorClass?: string
  isLoading?: boolean
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function AttendanceSummaryCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass = 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
  isLoading,
}: AttendanceSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="card-flat p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Pulse className="h-3.5 w-20" />
          <Pulse className="h-8 w-8 rounded-lg" />
        </div>
        <Pulse className="h-7 w-24" />
        <Pulse className="h-3 w-28" />
      </div>
    )
  }

  return (
    <div className="card-flat p-4 hover:shadow-sm transition-shadow duration-150 group">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
          {title}
        </p>
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
          colorClass,
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value */}
      <p
        className="text-[22px] font-semibold text-foreground leading-none tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>

      {/* Description */}
      {description && (
        <p className="mt-1.5 text-[12px] text-muted-foreground leading-tight">{description}</p>
      )}
    </div>
  )
}
