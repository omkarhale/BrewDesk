import { Badge } from '@/components/ui/badge'
import { getAttendanceStatusLabel, getAttendanceStatusVariant } from '@/lib/utils'
import { AttendanceStatus } from '@/types/attendance'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  const label = getAttendanceStatusLabel(status)
  const variant = getAttendanceStatusVariant(status)

  return <Badge variant={variant}>{label}</Badge>
}
