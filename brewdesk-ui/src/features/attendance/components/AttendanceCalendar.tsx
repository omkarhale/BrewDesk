'use client'

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AttendanceCalculationResponse, AttendanceStatus } from '@/types/attendance'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

// ── Status config — greytHR colour coding ─────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { code: string; textClass: string; bgClass: string; label: string }
> = {
  PRESENT:    { code: 'P',  textClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',  label: 'Present' },
  ABSENT:     { code: 'A',  textClass: 'text-red-500 dark:text-red-400',         bgClass: 'bg-red-50 dark:bg-red-900/20',           label: 'Absent' },
  HALF_DAY:   { code: 'HD', textClass: 'text-amber-600 dark:text-amber-400',     bgClass: 'bg-amber-50 dark:bg-amber-900/20',       label: 'Half Day' },
  INCOMPLETE: { code: 'I',  textClass: 'text-orange-500 dark:text-orange-400',   bgClass: 'bg-orange-50 dark:bg-orange-900/20',     label: 'Incomplete' },
  WEEK_OFF:   { code: 'WO', textClass: 'text-slate-400',                         bgClass: '',                                       label: 'Week Off' },
  HOLIDAY:    { code: 'H',  textClass: 'text-blue-500 dark:text-blue-400',       bgClass: 'bg-blue-50 dark:bg-blue-900/20',         label: 'Holiday' },
  ON_LEAVE:   { code: 'L',  textClass: 'text-purple-500 dark:text-purple-400',   bgClass: 'bg-purple-50 dark:bg-purple-900/20',     label: 'On Leave' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground px-1 pt-1 border-t border-border">
      {Object.values(STATUS_CONFIG).map((cfg) => (
        <span key={cfg.code} className="flex items-center gap-1">
          <span className={cn('font-bold', cfg.textClass)}>{cfg.code}</span>
          <span>{cfg.label}</span>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="font-bold text-slate-400">WO</span>
        <span>Weekend</span>
      </span>
    </div>
  )
}

// ── Props / component ─────────────────────────────────────────────────────────

interface AttendanceCalendarProps {
  records: AttendanceCalculationResponse[]
  isLoading?: boolean
  selectedDate?: string | null
  onDateClick?: (date: string, record: AttendanceCalculationResponse | null) => void
  /** 2-char shift code shown bottom-right of each cell, e.g. "M1" */
  shiftCode?: string
}

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

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3 select-none">

        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={goToPrev}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />Prev
          </button>
          <h3 className="text-base font-semibold">{monthLabel}</h3>
          <button
            onClick={goToNext}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Next<ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── Day headers ── */}
        <div className="grid grid-cols-7 pb-1 border-b border-border">
          {DAYS.map((d) => (
            <div key={d} className={cn(
              'text-center text-xs font-semibold py-1.5',
              d === 'Sun' || d === 'Sat'
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-muted-foreground',
            )}>
              {d}
            </div>
          ))}
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-card h-[80px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {grid.map((date, idx) => {
              if (!date) return <div key={`pad-${idx}`} className="bg-card min-h-[80px]" />

              const iso    = toIso(date)
              const record = recordMap[iso] ?? null
              const cfg    = record ? STATUS_CONFIG[record.status] : null
              const today_ = isToday(date)
              const wknd   = isWeekend(date)
              const sel    = selectedDate === iso
              const future = toIso(date) > toIso(today)

              return (
                <Tooltip key={iso}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => !future && onDateClick?.(iso, record)}
                      className={cn(
                        'relative flex flex-col items-start p-1.5 min-h-[80px] w-full text-left',
                        'transition-colors duration-100',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400',
                        cfg?.bgClass || 'bg-card',
                        !cfg && wknd && 'bg-slate-50 dark:bg-slate-900/30',
                        today_ && 'ring-2 ring-inset ring-amber-500 z-10',
                        sel && !today_ && 'ring-2 ring-inset ring-blue-400 z-10',
                        !future && onDateClick ? 'cursor-pointer hover:brightness-[0.97] dark:hover:brightness-110' : 'cursor-default',
                        future && 'opacity-40',
                      )}
                    >
                      {/* Date number */}
                      <span className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        today_ ? 'bg-amber-500 text-white'
                          : wknd ? 'text-blue-500 dark:text-blue-400'
                          : 'text-foreground',
                      )}>
                        {date.getDate()}
                      </span>

                      {/* Weekend label (no record) */}
                      {wknd && !cfg && (
                        <span className="absolute top-1 right-1.5 text-[10px] font-semibold text-slate-300 dark:text-slate-600">
                          WO
                        </span>
                      )}

                      {/* Status code */}
                      {cfg && (
                        <span className={cn('mt-1 text-sm font-black leading-none', cfg.textClass)}>
                          {cfg.code}
                        </span>
                      )}

                      {/* Shift code */}
                      {shiftCode && !future && (
                        <span className="absolute bottom-1 right-1.5 text-[10px] font-medium text-muted-foreground/50">
                          {shiftCode}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>

                  {/* Tooltip — only when there's a record */}
                  {record && cfg && (
                    <TooltipContent side="top" className="space-y-1 max-w-[180px]">
                      <p className={cn('font-semibold text-xs', cfg.textClass)}>{cfg.label}</p>
                      {record.firstIn   && <p className="text-xs">In: {new Date(record.firstIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                      {record.lastOut   && <p className="text-xs">Out: {new Date(record.lastOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                      {record.totalWorkMinutes > 0 && <p className="text-xs">Work: {Math.floor(record.totalWorkMinutes / 60)}h {record.totalWorkMinutes % 60}m</p>}
                      {record.lateMinutes > 0       && <p className="text-xs text-amber-500">Late: {record.lateMinutes} min</p>}
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
