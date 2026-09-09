'use client'

import { RegularizationType } from '@/types/attendance'

const LABELS: Record<RegularizationType, string> = {
  MISSED_PUNCH:    'Missed Punch',
  INCORRECT_PUNCH: 'Incorrect Punch',
  LATE_ARRIVAL:    'Late Arrival',
  EARLY_EXIT:      'Early Exit',
  HALF_DAY:        'Half Day',
  FULL_DAY:        'Full Day',
}

export function RegularizationTypeLabel({ type }: { type: RegularizationType }) {
  return <span className="text-[13px] font-medium text-foreground">{LABELS[type]}</span>
}

export function getRegularizationTypeLabel(type: RegularizationType): string {
  return LABELS[type]
}
