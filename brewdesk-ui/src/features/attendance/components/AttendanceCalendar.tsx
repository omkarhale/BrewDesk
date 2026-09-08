'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AttendanceCalculationResponse, AttendanceStatus } from '@/types/attendance'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

// ── Status config — Rippling colour palette ───────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { code: string; label: string; cellBg: string; codeClass: string; dotClass: string }
> = {
  PRESENT:    {
    code: 'P',  label: 'Present',
    cellBg:   'bg-teal-50 dark:bg-teal-900/15',
    codeClass: 'text-teal-700 dark:text-teal-400',
    dotClass:  'bg-teal-500',
  },
  ABSENT:     {
    code: 'A',  label: 'Absent',
    cellBg:   'bg-red-50 dark:bg-red-900/15',
    codeClass: 'text-red-500 dark:text-red-400',
    dotClass:  'bg-red-500',
  },
  HALF_DAY:   {
    code: 'HD', label: 'Half Day',
    cellBg:   'bg-amber-50 dark:bg-amber-900/15',
    codeClass: 'text-amber-600 dark:text-amber-400',
    dotClass:  'bg-amber-500',
  },
  INCOMPLETE: {
    code: 'I',  label: 'Incomplete',
    cellBg:   'bg-orange-50 dark:bg-orange-900/15',
    codeClass: 'text-orange-500 dark:text-orange-400',
    dotClass:  'bg-orange-500',
  },
  WEEK_OFF:   {
    code: 'WO', label: 'Week Off',
    cellBg:   '',
    codeClass: 'text-slate-400 dark:text-slate-500',
    dotClass:  'bg-slate-300',
  },
  HOLIDAY:    {
    code: 'H',  label: 'Holiday',
    cellBg:   'bg-blue-50 dark:bg-blue-900/15',
    codeClass: 'text-blue-500 dark:text-blue-400',
    dotClass:  'bg-blue-500',
  },
  ON_LEAVE:   {
    code: 'L',  label: 'On Leave',
    cellBg:   'bg-purple-50 dark:bg-purple-900/15',
    codeClass: 'text-purple-500 dark:text-purple-400',
    dotClass:  'bg-purple-500',
  },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// ── Grid helpers ──────────────────────────────────────────────────────────────

function buildGrid(year: number, month: number): (Date | null)[] {
  const first    = new Date(year, month - 1, 1)
  const last     = new Date(year, month, 0)
  const startPad = first.getDay()
  const endPad   = 6 - last.getDay()
  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month - 1, d))
  for (let i = 0; i < endPad; i++) days.push(null)
  return days
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6 }

function isToday(d: Date) {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 border-t border-border">
      {Object.values(STATUS_CONFIG).map((cfg) => (
        <span key={cfg.code} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dotClass)} />
          <span>{cfg.label}</span>
        </span>
      ))}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AttendanceCalendarProps {
  records:        AttendanceCalculationResponse[]
  isLoading?:     boolean
  selectedDate?:  string | null
  onDateClick?:   (date: string, record: AttendanceCalculationResponse | null) => void
  shiftCode?:     string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttendanceCalendar({
  records,
  isLoading = false,
  selectedDate,
  onDateClick,
  shiftCode,
}: AttendanceCalendarProps) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const recordMap = useMemo(() => {
    const m: Record<string, AttendanceCalculationResponse> = {}
    records.forEach((r) => { m[r.attendanceDate] = r })
    return m
  }, [records])

  const grid = useMemo(() => buildGrid(year, month), [year, month])

  const monthLabel = new Date(year, month - 1).toLocaleString('en-IN', {
    month: 'long', year: 'numeric',
  })

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }

  // Summary counts for the month
  const summary = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.values(recordMap).forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1
    })
    return counts
  }, [recordMap])

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-3 select-none">

        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrev}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-center">
            <h3
              className="text-[14px] font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {monthLabel}
            </h3>
            {/* Mini summary pills */}
            <div className="flex items-center justify-center gap-2 mt-1">
              {summary['PRESENT'] && (
                <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                  {summary['PRESENT']}P
                </span>
              )}
              {summary['ABSENT'] && (
                <span className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                  {summary['ABSENT']}A
                </span>
              )}
              {summary['HALF_DAY'] && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  {summary['HALF_DAY']}HD
                </span>
              )}
              {summary['INCOMPLETE'] && (
                <span className="text-[11px] text-orange-500 dark:text-orange-400 font-medium">
                  {summary['INCOMPLETE']}I
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={goToNext}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── Day-of-week headers ── */}
        <div className="grid grid-cols-7 border-b border-border pb-1.5">
          {DAYS.map((d) => (
            <div
              key={d}
              className={cn(
                'text-center text-[11px] font-semibold py-1',
                d === 'Sun' || d === 'Sat'
                  ? 'text-blue-400 dark:text-blue-500'
                  : 'text-muted-foreground',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-[68px] rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((date, idx) => {
              if (!date) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="h-[68px] rounded-md bg-transparent"
                  />
                )
              }

              const iso    = toIso(date)
              const record = recordMap[iso] ?? null
              const cfg    = record ? STATUS_CONFIG[record.status] : null
              const today_ = isToday(date)
              const wknd   = isWeekend(date)
              const sel    = selectedDate === iso
              const future = iso > toIso(today)
              const clickable = !future && !!onDateClick

              return (
                <Tooltip key={iso}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => clickable && onDateClick?.(iso, record)}
                      disabled={future || !onDateClick}
                      className={cn(
                        'relative flex flex-col items-start p-1.5 h-[68px] w-full rounded-md text-left',
                        'transition-colors duration-100',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:z-10',

                        // Base background
                        cfg?.cellBg || (wknd ? 'bg-slate-50 dark:bg-slate-900/20' : 'bg-white dark:bg-card/50'),

                        // Selected ring
                        sel && !today_ && 'ring-2 ring-teal-400 ring-inset z-10',

                        // Today ring
                        today_ && 'ring-2 ring-teal-600 ring-inset z-10',

                        // Hover
                        clickable && !future && 'hover:brightness-[0.97] dark:hover:brightness-[1.08] cursor-pointer',

                        // Future fade
                        future && 'opacity-30 cursor-default',
                      )}
                    >
                      {/* Date number */}
                      <span className={cn(
                        'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold leading-none',
                        today_
                          ? 'bg-teal-600 text-white'
                          : wknd
                          ? 'text-blue-400 dark:text-blue-500'
                          : 'text-foreground',
                      )}>
                        {date.getDate()}
                      </span>

                      {/* Status code */}
                      {cfg && (
                        <span className={cn('mt-1 text-[12px] font-bold leading-none', cfg.codeClass)}>
                          {cfg.code}
                        </span>
                      )}

                      {/* Weekend label (no record) */}
                      {wknd && !cfg && (
                        <span className="absolute bottom-1 right-1.5 text-[9px] font-semibold text-slate-300 dark:text-slate-600">
                          WO
                        </span>
                      )}

                      {/* Shift code pill */}
                      {shiftCode && !future && (
                        <span className="absolute bottom-1 right-1.5 text-[9px] font-medium text-muted-foreground/40">
                          {shiftCode}
                        </span>
                      )}

                      {/* Status dot — bottom-left indicator bar */}
                      {cfg && (
                        <span className={cn(
                          'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-t-full',
                          cfg.dotClass,
                        )} />
                      )}
                    </button>
                  </TooltipTrigger>

                  {/* Tooltip */}
                  {record && cfg && !future && (
                    <TooltipContent side="top" className="space-y-1 max-w-[200px] p-3">
                      <p className={cn('text-[12px] font-semibold', cfg.codeClass)}>{cfg.label}</p>
                      {record.firstIn && (
                        <p className="text-[11px] text-muted-foreground">
                          In: <span className="font-mono font-medium text-foreground">
                            {new Date(record.firstIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      )}
                      {record.lastOut && (
                        <p className="text-[11px] text-muted-foreground">
                          Out: <span className="font-mono font-medium text-foreground">
                            {new Date(record.lastOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      )}
                      {record.totalWorkMinutes > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Work: <span className="font-medium text-foreground">
                            {Math.floor(record.totalWorkMinutes / 60)}h {record.totalWorkMinutes % 60}m
                          </span>
                        </p>
                      )}
                      {record.lateMinutes > 0 && (
                        <p className="text-[11px] text-amber-600">Late {record.lateMinutes}m</p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        )}

        {/* ── Legend ── */}
        <Legend />
      </div>
    </TooltipProvider>
  )
}
