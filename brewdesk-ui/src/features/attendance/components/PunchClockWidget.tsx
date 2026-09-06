'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatAttendanceTime, formatWorkMinutes, isOvernightSession } from '@/lib/utils'
import { AttendanceSession } from '@/types/attendance'
import { Clock, Loader2, LogIn, LogOut, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'

// ── Live clock ────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
      {time.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      })}
    </span>
  )
}

// ── Today session mini-timeline ───────────────────────────────────────────────

function SessionTimeline({ sessions }: { sessions: AttendanceSession[] }) {
  if (sessions.length === 0) return null
  const total = sessions.reduce((s, se) => s + se.workedMinutes, 0)

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Today&apos;s Sessions
      </p>
      <div className="space-y-1.5">
        {sessions.map((sess, idx) => {
          const overnight = sess.punchOut ? isOvernightSession(sess.punchIn, sess.punchOut) : false
          const incomplete = !sess.punchOut
          return (
            <div
              key={sess.id}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                incomplete
                  ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
                  : 'bg-muted/50 border border-border',
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold shrink-0">S{idx + 1}</span>
                <LogIn className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="font-mono text-xs">{formatAttendanceTime(sess.punchIn)}</span>
                <span className="text-muted-foreground">→</span>
                {incomplete ? (
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 truncate">
                    In progress…
                  </span>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="font-mono text-xs">
                      {formatAttendanceTime(sess.punchOut)}
                      {overnight && <span className="ml-1 text-amber-500 text-[10px]">(+1)</span>}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs font-semibold tabular-nums shrink-0 ml-2">
                {formatWorkMinutes(sess.workedMinutes)}
              </span>
            </div>
          )
        })}
      </div>
      {sessions.length > 1 && (
        <div className="flex items-center justify-between px-1 pt-1 border-t border-border text-sm">
          <span className="text-muted-foreground">Total today</span>
          <span className="font-bold">{formatWorkMinutes(total)}</span>
        </div>
      )}
    </div>
  )
}

// ── Widget ────────────────────────────────────────────────────────────────────

interface PunchClockWidgetProps {
  employeeCode: string | undefined
  shiftName: string | undefined
  todaySessions: AttendanceSession[]
  isPunching: boolean
  onPunch: () => void
  isLoadingProfile?: boolean
}

export function PunchClockWidget({
  employeeCode,
  shiftName,
  todaySessions,
  isPunching,
  onPunch,
  isLoadingProfile = false,
}: PunchClockWidgetProps) {
  // If last session has no punchOut → currently inside a session → next action is Punch Out
  const isCurrentlyIn =
    todaySessions.length > 0 && todaySessions[todaySessions.length - 1].punchOut === null

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Card className="overflow-hidden border-border">
      {/* Gradient top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

      <CardContent className="p-6 space-y-6">
        {/* Clock */}
        <div className="text-center space-y-1">
          <LiveClock />
          <p className="text-xs text-muted-foreground">{today}</p>
        </div>

        {/* Punch button */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onPunch}
            disabled={isPunching || isLoadingProfile || !employeeCode}
            className={cn(
              'h-16 w-48 rounded-2xl text-base font-bold gap-2.5 shadow-md',
              isCurrentlyIn
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
            )}
          >
            {isPunching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isCurrentlyIn ? (
              <LogOut className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {isPunching ? 'Recording…' : isCurrentlyIn ? 'Punch Out' : 'Punch In'}
          </Button>

          {/* Live status dot */}
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              'h-2.5 w-2.5 rounded-full shrink-0',
              isCurrentlyIn ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30',
            )} />
            <span className={cn(
              'font-medium text-xs',
              isCurrentlyIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
            )}>
              {isCurrentlyIn ? 'Currently checked in' : 'Not checked in'}
            </span>
          </div>
        </div>

        {/* Employee / shift info */}
        {(employeeCode || shiftName) && (
          <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border px-3.5 py-2.5">
            {employeeCode && (
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold font-mono">{employeeCode}</span>
              </div>
            )}
            {shiftName && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{shiftName}</span>
              </div>
            )}
          </div>
        )}

        {/* Sessions */}
        <SessionTimeline sessions={todaySessions} />

        {/* No profile warning */}
        {!isLoadingProfile && !employeeCode && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 text-center">
            No employee profile linked to your account.
            Contact HR to set it up before punching.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
