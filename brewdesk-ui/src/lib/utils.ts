import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1]
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Return a human-readable greeting based on the current hour. */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Format a time string "HH:mm:ss" → "09:00 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Format ISO datetime string → "09:42 AM" */
export function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Extract a friendly error message from an Axios error */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const status = err.response?.status
    const serverMsg = err.response?.data?.message

    if (status === 401) return 'Your session has expired. Please login again.'
    if (status === 403) return "You don't have permission to access this."
    if (status === 409) return 'You have already registered for this round.'
    if (status === 404) return 'The requested resource was not found.'
    if (status === 400) return serverMsg || 'Invalid request. Please check your input.'
    if (status && status >= 500) return 'Something went wrong on the server. Please try again.'
    if (serverMsg) return serverMsg
    if (err.message) return err.message
  }
  return 'An unexpected error occurred. Please try again.'
}

// ── Attendance-specific utilities ───────────────────────────────────────────────

/** Format work minutes to "Xh Ym" format */
export function formatWorkMinutes(minutes: number): string {
  if (minutes === 0) return '0h 00m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

/** Format attendance ISO datetime to time string "09:30 AM" */
export function formatAttendanceTime(iso: string | null, showDate: boolean = false): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (showDate) {
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    return `${time} (${date})`
  }
  return time
}

/** Format attendance date to "04 Sep 2026" */
export function formatAttendanceDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format shift time range "09:30 → 18:30" */
export function formatShiftTime(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} → ${formatTime(endTime)}`
}

/** Check if shift is overnight (end time < start time) */
export function isOvernightShift(startTime: string, endTime: string): boolean {
  const [startH] = startTime.split(':').map(Number)
  const [endH] = endTime.split(':').map(Number)
  return endH < startH
}

/** Check if session spans across different days */
export function isOvernightSession(punchIn: string, punchOut: string | null): boolean {
  if (!punchOut) return false
  const inDate = new Date(punchIn).toDateString()
  const outDate = new Date(punchOut).toDateString()
  return inDate !== outDate
}

/** Format late/early exit minutes */
export function formatLateMinutes(minutes: number): string {
  if (minutes === 0) return '0 min'
  return `${minutes} min`
}

/** Get display label for attendance status */
export function getAttendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    HALF_DAY: 'Half Day',
    INCOMPLETE: 'Incomplete',
    WEEK_OFF: 'Week Off',
    HOLIDAY: 'Holiday',
    ON_LEAVE: 'On Leave',
  }
  return labels[status] || status
}

/** Get color variant for attendance status badge */
export function getAttendanceStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'secondary' {
  const variants: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
    PRESENT: 'success',
    ABSENT: 'danger',
    HALF_DAY: 'warning',
    INCOMPLETE: 'danger',
    WEEK_OFF: 'secondary',
    HOLIDAY: 'secondary',
    ON_LEAVE: 'warning',
  }
  return variants[status] || 'secondary'
}
