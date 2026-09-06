'use client'

import { useState, useMemo } from 'react'
import { useMyProfile, useMyMonthAttendance, useWebPunch } from '@/hooks/useWebPunch'
import { useAttendanceCalculation } from '@/hooks/useAttendance'
import { calculateAttendance } from '@/api/attendance'
import { PunchClockWidget } from '@/features/attendance/components/PunchClockWidget'
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar'
import { AttendanceSessionTable } from '@/features/attendance/components/AttendanceSessionTable'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { AttendanceSummaryCard } from '@/features/attendance/components/AttendanceSummaryCard'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle, CalendarDays, LogIn, LogOut, RefreshCw, Timer,
} from 'lucide-react'
import {
  formatAttendanceDate, formatAttendanceTime, formatLateMinutes, formatWorkMinutes,
} from '@/lib/utils'
import { AttendanceCalculationResponse, AttendanceSession } from '@/types/attendance'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function todaySessions(
  records: AttendanceCalculationResponse[],
): AttendanceSession[] {
  const today = todayIso()
  return records.find((r) => r.attendanceDate === today)?.sessions ?? []
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyAttendancePage() {
  const today = new Date()
  const [calYear,  setCalYear]  = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceCalculationResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const punchMutation = useWebPunch()

  const {
    data: monthRecords = [],
    isLoading: calLoading,
    refetch: refetchMonth,
  } = useMyMonthAttendance(calYear, calMonth, profile?.employeeCode)

  const sessionsTodaySoFar = useMemo(() => todaySessions(monthRecords), [monthRecords])

  // ── Handle date cell click — auto-calculate if no record yet ──────────────

  const handleDateClick = async (
    date: string,
    record: AttendanceCalculationResponse | null,
  ) => {
    // Don't re-calculate future dates
    if (date > todayIso()) return

    setSelectedDate(date)

    if (record) {
      setSelectedRecord(record)
      return
    }

    if (!profile?.employeeCode) return

    // Auto-calculate for dates with events but no record
    setIsCalculating(true)
    try {
      const result = await calculateAttendance(profile.employeeCode, date)
      setSelectedRecord(result)
      refetchMonth()
    } catch {
      toast.error('Could not calculate attendance for that date.')
    } finally {
      setIsCalculating(false)
    }
  }

  // ── Punch handler ─────────────────────────────────────────────────────────

  const handlePunch = async () => {
    await punchMutation.mutateAsync()
    // After punch, recalculate today so sessions refresh
    if (profile?.employeeCode) {
      try {
        await calculateAttendance(profile.employeeCode, todayIso())
        refetchMonth()
      } catch {
        // Calculation might fail if it's the first punch of the day — that's ok
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Attendance</h2>
          <p className="mt-1 text-muted-foreground">
            Track your check-ins, view history, and see monthly attendance at a glance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchMonth()} disabled={calLoading}>
          <RefreshCw className={`h-4 w-4 ${calLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ── Left — punch clock ── */}
        <div>
          {profileLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : (
            <PunchClockWidget
              employeeCode={profile?.employeeCode}
              shiftName={profile?.shiftName ?? undefined}
              todaySessions={sessionsTodaySoFar}
              isPunching={punchMutation.isPending}
              onPunch={handlePunch}
              isLoadingProfile={profileLoading}
            />
          )}
        </div>

        {/* ── Right — calendar ── */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Monthly View</CardTitle>
            </div>
            <CardDescription>
              Click any past date to see details. Green = Present, Red = Absent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceCalendar
              records={monthRecords}
              isLoading={calLoading}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              shiftCode={profile?.shiftName?.substring(0, 2).toUpperCase()}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Selected date detail ── */}
      {(selectedDate || isCalculating) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isCalculating
                ? 'Calculating…'
                : selectedRecord
                ? `Details — ${formatAttendanceDate(selectedDate!)}`
                : `No record for ${selectedDate}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCalculating ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : selectedRecord ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border px-4 py-2.5">
                  <AttendanceStatusBadge status={selectedRecord.status} />
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm font-medium">{selectedRecord.shiftName}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <AttendanceSummaryCard title="First In"   value={formatAttendanceTime(selectedRecord.firstIn)}   icon={LogIn}    colorClass="text-emerald-600" />
                  <AttendanceSummaryCard title="Last Out"   value={formatAttendanceTime(selectedRecord.lastOut)}   icon={LogOut}   colorClass="text-blue-600" />
                  <AttendanceSummaryCard title="Total Work" value={formatWorkMinutes(selectedRecord.totalWorkMinutes)} icon={Timer} colorClass="text-amber-600" />
                  <AttendanceSummaryCard title="Late"       value={formatLateMinutes(selectedRecord.lateMinutes)} icon={AlertCircle} colorClass="text-red-500" />
                </div>
                <AttendanceSessionTable sessions={selectedRecord.sessions} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attendance was calculated for this date. This could mean no punch events were found.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
