import { cn, formatAttendanceTime, formatWorkMinutes, isOvernightSession } from '@/lib/utils'
import { AttendanceSession } from '@/types/attendance'

interface AttendanceSessionTableProps {
  sessions:   AttendanceSession[]
  isLoading?: boolean
}

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

export function AttendanceSessionTable({ sessions, isLoading }: AttendanceSessionTableProps) {

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Punch Sessions
        </p>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="space-y-1.5">
              <Pulse className="h-3.5 w-24" />
              <Pulse className="h-3 w-32" />
            </div>
            <Pulse className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Punch Sessions
        </p>
        <p className="text-[13px] text-muted-foreground py-3 text-center">
          No punch sessions recorded.
        </p>
      </div>
    )
  }

  const total = sessions.reduce((s, se) => s + se.workedMinutes, 0)

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Punch Sessions
      </p>

      {/* Sessions */}
      <div className="card-flat overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header-rippling">
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Punch In</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Punch Out</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => {
              const incomplete = !session.punchOut
              const overnight  = !incomplete && isOvernightSession(session.punchIn, session.punchOut)

              return (
                <tr
                  key={session.id}
                  className={cn(
                    'border-t border-border text-[13px]',
                    incomplete ? 'bg-amber-50/50 dark:bg-amber-900/5' : '',
                  )}
                >
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">S{index + 1}</td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                      <span className="font-mono">{formatAttendanceTime(session.punchIn)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-2.5">
                    {incomplete ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                        <span className="text-amber-600 dark:text-amber-400 text-[12px] font-medium">In progress</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="font-mono">
                          {formatAttendanceTime(session.punchOut)}
                          {overnight && (
                            <span className="ml-1 text-amber-500 text-[10px]">+1d</span>
                          )}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {incomplete ? (
                      <span className="text-muted-foreground text-[12px]">—</span>
                    ) : (
                      formatWorkMinutes(session.workedMinutes)
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Total row */}
          {sessions.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-[hsl(220_20%_97%)] dark:bg-muted/40">
                <td className="px-4 py-2.5 text-[12px] font-semibold text-muted-foreground" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-2.5 text-right text-[14px] font-bold text-foreground tabular-nums">
                  {formatWorkMinutes(total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
