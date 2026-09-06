import { RoundStatus } from '@/types/round'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RoundStatusBadgeProps {
  status: RoundStatus
  className?: string
}

const statusConfig: Record<RoundStatus, { label: string; variant: 'open' | 'closed' | 'upcoming'; dot: string }> = {
  OPEN:     { label: 'Open',       variant: 'open',     dot: 'bg-emerald-500 animate-pulse' },
  CLOSED:   { label: 'Closed',     variant: 'closed',   dot: 'bg-slate-400' },
  UPCOMING: { label: 'Upcoming',   variant: 'upcoming', dot: 'bg-blue-400' },
}

export function RoundStatusBadge({ status, className }: RoundStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig['UPCOMING']
  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </Badge>
  )
}
