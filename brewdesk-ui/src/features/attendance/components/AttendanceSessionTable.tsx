import { AttendanceSession } from '@/types/attendance'
import { formatAttendanceTime, formatWorkMinutes, isOvernightSession } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AttendanceSessionTableProps {
  sessions: AttendanceSession[]
  isLoading?: boolean
}

export function AttendanceSessionTable({ sessions, isLoading }: AttendanceSessionTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punch Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punch Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No punch sessions available.</p>
        </CardContent>
      </Card>
    )
  }

  const totalWorkMinutes = sessions.reduce((sum, session) => sum + session.workedMinutes, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Punch Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isIncomplete = !session.punchOut
            const isOvernight = !isIncomplete && isOvernightSession(session.punchIn, session.punchOut)
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Session {index + 1}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatAttendanceTime(session.punchIn)} →{' '}
                    {isIncomplete ? (
                      <span className="text-red-500">Incomplete</span>
                    ) : (
                      <>
                        {formatAttendanceTime(session.punchOut)}
                        {isOvernight && <span className="ml-1 text-amber-600 text-[10px]">(+1 day)</span>}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatWorkMinutes(session.workedMinutes)}</p>
                  {isIncomplete && (
                    <Badge variant="danger" className="text-[10px] mt-1">
                      Missing punch-out
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {sessions.length > 1 && (
          <div className="mt-4 pt-3 border-t flex justify-between items-center">
            <p className="text-sm font-medium text-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{formatWorkMinutes(totalWorkMinutes)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
