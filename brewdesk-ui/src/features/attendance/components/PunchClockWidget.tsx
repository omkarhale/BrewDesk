'use client'

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
    <span
      className="font-mono text-[34px] font-semibold tabular-nums tracking-tight text-foreground"
    >
      {time.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      })}
    </span>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({ session, index }: { session: AttendanceSession; index: number }) {
  const overnight  = session.punchOut ? isOvernightSession(session.punchIn, session.punchOut) : false
  const incomplete = !session.punchOut

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]',
        incomplete
          ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'
          : 'bg-[hsl(220_20%_97%)] border border-border dark:bg-muted/40',
      )}
    >
      {/* Session label */}
      <span className="text-[11px] font-semibold text-muted-foreground w-5 shrink-0">
        S{index + 1}
      </span>

      {/* In */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
        <span className="font-mono text-[12px] font-medium">{formatAttendanceTime(session.punchIn)}</span>
      </div>

      <span className="text-muted-foreground/40 text-xs">→</span>

      {/* Out */}
      {incomplete ? (
        <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400 truncate">
          In progress
        </span>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
          <span className="font-mono text-[12px] font-medium">
            {formatAttendanceTime(session.punchOut)}
            {overnight && <span className="ml-0.5 text-amber-500 text-[10px]">+1</span>}
          </span>
        </div>
      )}

      {/* Duration — right-aligned */}
      <span className="ml-auto text-[12px] font-semibold tabular-nums text-muted-foreground shrink-0">
        {formatWorkMinutes(session.workedMinutes)}
      </span>
    </div>
  )
}

// ── Sessions timeline ─────────────────────────────────────────────────────────

function SessionTimeline({ sessions }: { sessions: AttendanceSession[] }) {
  if (sessions.length === 0) return null

  const total = sessions.reduce((s, se) => s + se.workedMinutes, 0)

  return (
    <div className="space-y-2 border-t border-border pt-4 mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Today&apos;s sessions
      </p>
      <div className="space-y-1.5">
        {sessions.map((sess, idx) => (
          <SessionRow key={sess.id} session={sess} index={idx} />
        ))}
      </div>
      {sessions.length > 1 && (
        <div className="flex items-center justify-between px-1 pt-1 text-[13px]">
          <span className="text-muted-foreground">Total today</span>
          <span className="font-semibold">{formatWorkMinutes(total)}</span>
        </div>
      )}
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────

interface PunchClockWidgetProps {
  employeeCode:     string | undefined
  shiftName:        string | undefined
  todaySessions:    AttendanceSession[]
  isPunching:       boolean
  onPunch:          () => void
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
  const isCurrentlyIn =
    todaySessions.length > 0 && todaySessions[todaySessions.length - 1].punchOut === null

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="card-flat overflow-hidden">
      {/* Teal top accent strip */}
      <div className="h-0.5 w-full bg-teal-500" />

      <div className="p-5 space-y-5">

        {/* ── Clock & date ── */}
        <div className="text-center space-y-0.5 pt-1">
          <LiveClock />
          <p className="text-[12px] text-muted-foreground">{today}</p>
        </div>

        {/* ── Status indicator ── */}
        <div className="flex items-center justify-center gap-2">
          <span className={cn(
            'h-2 w-2 rounded-full shrink-0',
            isCurrentlyIn ? 'bg-teal-500 animate-pulse' : 'bg-muted-foreground/25',
          )} />
          <span className={cn(
            'text-[12px] font-medium',
            isCurrentlyIn ? 'text-teal-700 dark:text-teal-400' : 'text-muted-foreground',
          )}>
            {isCurrentlyIn ? 'Currently checked in' : 'Not checked in'}
          </span>
        </div>

        {/* ── Punch button ── */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onPunch}
            disabled={isPunching || isLoadingProfile || !employeeCode}
            className={cn(
              'relative flex h-14 w-44 items-center justify-center gap-2.5 rounded-xl text-[14px] font-semibold text-white shadow-sm transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-[0.97]',
              isCurrentlyIn
                ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500'
                : 'bg-teal-600 hover:bg-teal-700',
            )}
          >
            {isPunching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCurrentlyIn ? (
              <LogOut className="h-4 w-4" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            <span>{isPunching ? 'Recording…' : isCurrentlyIn ? 'Punch Out' : 'Punch In'}</span>
          </button>
        </div>

        {/* ── Employee / shift info chip ── */}
        {(employeeCode || shiftName) && (
          <div className="flex items-center justify-between rounded-lg bg-[hsl(220_20%_97%)] border border-border dark:bg-muted/40 px-3 py-2">
            {employeeCode && (
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="font-mono text-[12px] font-semibold text-foreground">{employeeCode}</span>
              </div>
            )}
            {shiftName && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[12px] text-muted-foreground">{shiftName}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Sessions ── */}
        <SessionTimeline sessions={todaySessions} />

        {/* ── No profile warning ── */}
        {!isLoadingProfile && !employeeCode && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 px-3.5 py-3 text-[12px] text-amber-800 dark:text-amber-300 text-center leading-relaxed">
            No employee profile linked to your account.
            <br />Contact HR to set it up before punching.
          </div>
        )}
      </div>
    </div>
  )
}
