'use client'

import { useQuery } from '@tanstack/react-query'
import { getAttendanceRecords } from '@/api/attendance'
import { AttendanceRecordsParams, AttendanceStatus } from '@/types/attendance'

export const attendanceRecordKeys = {
  all: ['attendance', 'records'] as const,
  filtered: (params: AttendanceRecordsParams) =>
    ['attendance', 'records', params] as const,
}

export function useAttendanceRecords(params: AttendanceRecordsParams) {
  return useQuery({
    queryKey: attendanceRecordKeys.filtered(params),
    queryFn: () => getAttendanceRecords(params),
    placeholderData: (prev) => prev, // keep previous page data while fetching next
  })
}

export const ALL_STATUSES: { value: AttendanceStatus | ''; label: string }[] = [
  { value: '',           label: 'All Statuses' },
  { value: 'PRESENT',   label: 'Present' },
  { value: 'ABSENT',    label: 'Absent' },
  { value: 'HALF_DAY',  label: 'Half Day' },
  { value: 'INCOMPLETE',label: 'Incomplete' },
  { value: 'WEEK_OFF',  label: 'Week Off' },
  { value: 'HOLIDAY',   label: 'Holiday' },
  { value: 'ON_LEAVE',  label: 'On Leave' },
]
