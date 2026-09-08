'use client'

import { calculateAttendance } from '@/api/attendance'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar'
import { AttendanceSessionTable } from '@/features/attendance/components/AttendanceSessionTable'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { AttendanceSummaryCard } from '@/features/attendance/components/AttendanceSummaryCard'
import { PunchClockWidget } from '@/features/attendance/components/PunchClockWidget'
import { useMyMonthAttendance, useMyProfile, useWebPunch } from '@/hooks/useWebPunch'
import {
  formatAttendanceDate,
  formatAttendanceTime,
  formatLateMinutes,
  formatWorkMinutes,
} from '@/lib/utils'
import { AttendanceCalculationResponse, AttendanceSession } from '@/types/attendance'
import { AlertCircle, CalendarDays, LogIn, LogOut, RefreshCw, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function todaySessions(records: AttendanceCalculationResponse[]): AttendanceSession[] {
  const today = todayIso()
  return records.find((r) => r.attendanceDate === today)?.sessions ?? []
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  action,
  children,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="card-flat overflow-hidden">
      {(title || action) && (
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            {title && (
              <h3
                className="text-[14px] font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyAttendancePage() {
  const today = new Date()
  const [selectedDate,   setSelectedDate]   = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceCalculationResponse | null>(null)
  const [isCalculating,  setIsCalculating]  = useState(false)

  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const punchMutation = useWebPunch()

  const {
    data:    monthRecords = [],
    isLoading: calLoading,
    refetch: refetchMonth,
  } = useMyMonthAttendance(today.getFullYear(), today.getMonth() + 1, profile?.employeeCode)

  const sessionsTodaySoFar = useMemo(() => todaySessions(monthRecords), [monthRecords])

  // ── Date cell click ───────────────────────────────────────────────────────

  const handleDateClick = async (
    date: string,
    record: AttendanceCalculationResponse | null,
  ) => {
    if (date > todayIso()) return
    setSelectedDate(date)

    if (record) {
      setSelectedRecord(record)
      return
    }

    if (!profile?.employeeCode) return

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
    if (profile?.employeeCode) {
      try {
        await calculateAttendance(profile.employeeCode, todayIso())
        refetchMonth()
      } catch {
        // first punch of the day — calculation may not have a record yet
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-[22px] font-semibold text-foreground tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            My Attendance
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Track your check-ins, view history, and see monthly attendance at a glance.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchMonth()}
          disabled={calLoading}
          className="gap-1.5 text-[13px] h-8"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${calLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── Main grid — punch clock + calendar ── */}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">

        {/* Left — punch clock */}
        <div>
          {profileLoading ? (
            <div className="card-flat p-5 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-10 w-full" />
            </div>
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

        {/* Right — calendar */}
        <Section
          title="Monthly View"
          description="Click any past date to see attendance details"
        >
          <AttendanceCalendar
            records={monthRecords}
            isLoading={calLoading}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            shiftCode={profile?.shiftName?.substring(0, 2).toUpperCase()}
          />
        </Section>
      </div>

      {/* ── Selected date detail ── */}
      {(selectedDate || isCalculating) && (
        <div className="card-flat overflow-hidden">

          {/* Detail header */}
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : selectedRecord ? (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className="text-[14px] font-semibold text-foreground"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {formatAttendanceDate(selectedDate!)}
                  </span>
                  <span className="text-muted-foreground/30 text-sm">·</span>
                  <AttendanceStatusBadge status={selectedRecord.status} />
                  <span className="text-muted-foreground/30 text-sm">·</span>
                  <span className="text-[12px] text-muted-foreground">{selectedRecord.shiftName}</span>
                </div>
              ) : (
                <span className="text-[14px] font-medium text-muted-foreground">
                  No record for {selectedDate}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {isCalculating ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card-flat p-4 space-y-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                ))}
              </div>
            ) : selectedRecord ? (
              <>
                {/* Stat cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <AttendanceSummaryCard
                    title="First In"
                    value={formatAttendanceTime(selectedRecord.firstIn)}
                    icon={LogIn}
                    colorClass="text-teal-600 bg-teal-50 dark:bg-teal-900/20"
                  />
                  <AttendanceSummaryCard
                    title="Last Out"
                    value={formatAttendanceTime(selectedRecord.lastOut)}
                    icon={LogOut}
                    colorClass="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  />
                  <AttendanceSummaryCard
                    title="Total Work"
                    value={formatWorkMinutes(selectedRecord.totalWorkMinutes)}
                    icon={Timer}
                    colorClass="text-violet-600 bg-violet-50 dark:bg-violet-900/20"
                  />
                  <AttendanceSummaryCard
                    title="Late"
                    value={formatLateMinutes(selectedRecord.lateMinutes)}
                    icon={AlertCircle}
                    colorClass="text-red-500 bg-red-50 dark:bg-red-900/20"
                  />
                </div>

                {/* Sessions table */}
                <AttendanceSessionTable sessions={selectedRecord.sessions} />
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground py-4 text-center">
                No attendance was calculated for this date. This could mean no punch events were found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
