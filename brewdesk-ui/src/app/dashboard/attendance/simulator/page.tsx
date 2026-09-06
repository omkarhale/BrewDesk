'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, Calculator, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeesQuery } from '@/hooks/useEmployeeManagement'
import { useAttendanceCalculation } from '@/hooks/useAttendance'
import { simulatePunch, calculateAttendance } from '@/api/attendance'
import { getErrorMessage, formatAttendanceTime, formatWorkMinutes, formatLateMinutes, formatAttendanceDate } from '@/lib/utils'
import { SimulatePunchFormValues } from '@/schemas/attendance.schema'
import { PunchSimulatorForm } from '@/features/attendance/components/PunchSimulatorForm'
import { PunchLogList, PunchLogEntry } from '@/features/attendance/components/PunchLogList'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { AttendanceSummaryCard } from '@/features/attendance/components/AttendanceSummaryCard'
import { AttendanceSessionTable } from '@/features/attendance/components/AttendanceSessionTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  AlertCircle,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  Timer,
} from 'lucide-react'

export default function PunchSimulatorPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const { data: employees = [], isLoading: employeesLoading } = useEmployeesQuery()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [punchLog, setPunchLog] = useState<PunchLogEntry[]>([])

  // Attendance calculation state — reuse existing hook
  const { attendance, isLoading: calcLoading, error: calcError, calculate, reset: resetCalc } = useAttendanceCalculation()
  const [lastCalculatedCode, setLastCalculatedCode] = useState<string | null>(null)
  const [lastCalculatedDate, setLastCalculatedDate] = useState<string | null>(null)

  // ── Send punch ──────────────────────────────────────────────────────────────
  const handlePunchSubmit = useCallback(
    async (values: SimulatePunchFormValues) => {
      setIsSubmitting(true)

      const eventTime = `${values.eventDate}T${values.eventTime}:00`

      const logEntry: PunchLogEntry = {
        id: crypto.randomUUID(),
        employeeCode: values.employeeCode,
        eventDate: values.eventDate,
        eventTime: values.eventTime,
        source: values.source,
        externalEventId: values.externalEventId,
        status: 'success',
        submittedAt: new Date(),
      }

      try {
        await simulatePunch({
          employeeCode: values.employeeCode,
          eventTime,
          source: values.source,
          eventType: 'PUNCH',
          externalEventId: values.externalEventId,
        })

        setPunchLog((prev) => [logEntry, ...prev])
        toast.success(`Punch recorded for ${values.employeeCode} at ${values.eventTime}`)

        // Remember last employee + date for quick re-calculate
        setLastCalculatedCode(values.employeeCode)
        setLastCalculatedDate(values.eventDate)
      } catch (err) {
        const msg = getErrorMessage(err)
        setPunchLog((prev) => [
          { ...logEntry, status: 'error', errorMessage: msg },
          ...prev,
        ])
        toast.error(msg)
      } finally {
        setIsSubmitting(false)
      }
    },
    [],
  )

  // ── Calculate attendance ────────────────────────────────────────────────────
  const handleCalculate = useCallback(async () => {
    if (!lastCalculatedCode || !lastCalculatedDate) return
    await calculate(lastCalculatedCode, lastCalculatedDate)
  }, [calculate, lastCalculatedCode, lastCalculatedDate])

  // ── Access guard ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
        <p className="text-sm text-muted-foreground">
          The punch simulator is only available to administrators.
        </p>
      </div>
    )
  }

  const successCount = punchLog.filter((e) => e.status === 'success').length
  const errorCount = punchLog.filter((e) => e.status === 'error').length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-bold text-foreground">Punch Simulator</h2>
          <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            DEV ONLY
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">
          Simulate attendance punch events for testing without physical hardware.
        </p>
      </div>

      {/* Dev-only warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          This tool is for development and QA only. Punches submitted here create real attendance
          events in the database. Do not use in production with live employee data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left column: form ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-amber-600" />
                Send Punch Event
              </CardTitle>
              <CardDescription>
                Creates an attendance event via{' '}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                  POST /api/dev/attendance/simulate
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <PunchSimulatorForm
                  employees={employees}
                  isSubmitting={isSubmitting}
                  onSubmit={handlePunchSubmit}
                />
              )}
            </CardContent>
          </Card>

          {/* Quick calculate button */}
          {lastCalculatedCode && lastCalculatedDate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-4 w-4 text-violet-600" />
                  Calculate Attendance
                </CardTitle>
                <CardDescription>
                  Run calculation for the last punched employee to see the result immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-4 py-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Employee</p>
                    <p className="font-mono font-semibold text-sm">{lastCalculatedCode}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold text-sm">{lastCalculatedDate}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Punches sent</p>
                    <p className="font-semibold text-sm text-emerald-600">
                      {punchLog.filter(
                        (e) =>
                          e.status === 'success' &&
                          e.employeeCode === lastCalculatedCode &&
                          e.eventDate === lastCalculatedDate,
                      ).length}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCalculate}
                  disabled={calcLoading}
                  className="w-full"
                  variant="outline"
                >
                  {calcLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4" />
                      Run Calculation
                    </>
                  )}
                </Button>
                {attendance && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-muted-foreground"
                    onClick={resetCalc}
                  >
                    Clear result
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column: log + results ───────────────────────────────── */}
        <div className="space-y-6">
          {/* Session stats */}
          {punchLog.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Sent OK</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {successCount}
                </p>
              </div>
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-4 py-3">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{errorCount}</p>
              </div>
            </div>
          )}

          {/* Punch log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Punch Log</CardTitle>
              <CardDescription>Real-time log of this session&apos;s punch events.</CardDescription>
            </CardHeader>
            <CardContent>
              <PunchLogList
                entries={punchLog}
                onClear={() => setPunchLog([])}
              />
            </CardContent>
          </Card>

          {/* Attendance result */}
          {(attendance || calcError || calcLoading) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Attendance Result</h3>

              {calcError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{calcError}</p>
                </div>
              )}

              {calcLoading && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
                  ))}
                </div>
              )}

              {attendance && !calcLoading && (
                <>
                  {/* Info bar */}
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm">
                    <span className="font-mono font-semibold">{attendance.employeeCode}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{attendance.shiftName}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {formatAttendanceDate(attendance.attendanceDate)}
                    </span>
                    <span className="ml-auto">
                      <AttendanceStatusBadge status={attendance.status} />
                    </span>
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <AttendanceSummaryCard
                      title="First In"
                      value={formatAttendanceTime(attendance.firstIn)}
                      icon={LogIn}
                      colorClass="text-emerald-600"
                    />
                    <AttendanceSummaryCard
                      title="Last Out"
                      value={formatAttendanceTime(attendance.lastOut)}
                      icon={LogOut}
                      colorClass="text-blue-600"
                    />
                    <AttendanceSummaryCard
                      title="Total Work"
                      value={formatWorkMinutes(attendance.totalWorkMinutes)}
                      icon={Timer}
                      colorClass="text-amber-600"
                    />
                    <AttendanceSummaryCard
                      title="Late"
                      value={formatLateMinutes(attendance.lateMinutes)}
                      icon={AlertCircle}
                      colorClass="text-red-600"
                    />
                  </div>

                  {/* Sessions */}
                  <AttendanceSessionTable sessions={attendance.sessions} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
