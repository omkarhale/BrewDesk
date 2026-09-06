'use client'

import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PunchLogStatus = 'success' | 'error'

export interface PunchLogEntry {
  id: string
  employeeCode: string
  eventDate: string
  eventTime: string
  source: string
  externalEventId: string
  status: PunchLogStatus
  errorMessage?: string
  submittedAt: Date
}

interface PunchLogListProps {
  entries: PunchLogEntry[]
  onClear: () => void
}

const SOURCE_LABELS: Record<string, string> = {
  FACE: 'Face',
  FINGERPRINT: 'Fingerprint',
  RFID_CARD: 'RFID',
  WEB: 'Web',
  MOBILE: 'Mobile',
  ADMIN: 'Admin',
  API: 'API',
}

function formatSubmittedAt(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function PunchLogList({ entries, onClear }: PunchLogListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No punches sent yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Submitted punches will appear here in real time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {entries.length} punch{entries.length !== 1 ? 'es' : ''} sent this session
        </p>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear log
        </button>
      </div>

      <ol className="relative border-l border-border space-y-0">
        {entries.map((entry, index) => {
          const isSuccess = entry.status === 'success'
          const isFirst = index === 0

          return (
            <li key={entry.id} className="ml-4 pb-4 last:pb-0">
              {/* Timeline dot */}
              <span
                className={cn(
                  'absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background',
                  isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : 'bg-red-100 dark:bg-red-900/40',
                )}
              >
                {isSuccess ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </span>

              <div
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  isFirst && isSuccess
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
                    : isFirst && !isSuccess
                    ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
                    : 'border-border bg-card',
                )}
              >
                {/* Top row: code + time */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {entry.employeeCode}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      )}
                    >
                      {isSuccess ? 'OK' : 'FAILED'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatSubmittedAt(entry.submittedAt)}
                  </span>
                </div>

                {/* Details row */}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    {entry.eventDate}{' '}
                    <span className="font-medium text-foreground">{entry.eventTime}</span>
                  </span>
                  <span>·</span>
                  <span>{SOURCE_LABELS[entry.source] ?? entry.source}</span>
                  <span>·</span>
                  <span className="font-mono truncate max-w-[160px]" title={entry.externalEventId}>
                    {entry.externalEventId}
                  </span>
                </div>

                {/* Error message */}
                {!isSuccess && entry.errorMessage && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {entry.errorMessage}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
