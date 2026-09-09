'use client'

import { AttendanceCalculationResponse } from '@/types/attendance'
import { formatAttendanceTime, formatAttendanceDate, formatWorkMinutes, formatLateMinutes, isOvernightSession } from '@/lib/utils'
import { AttendanceStatusBadge } from './AttendanceStatusBadge'
import { AttendanceSessionTable } from './AttendanceSessionTable'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Clock, Calendar, User, Timer } from 'lucide-react'

interface AttendanceDetailDrawerProps {
  attendance: AttendanceCalculationResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttendanceDetailDrawer({ attendance, open, onOpenChange }: AttendanceDetailDrawerProps) {
  if (!attendance) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Attendance Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Employee Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Employee
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{attendance.employeeName ?? attendance.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee Code</span>
                <span className="font-medium">{attendance.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatAttendanceDate(attendance.attendanceDate)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Shift Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Shift
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shift Name</span>
                <span className="font-medium">{attendance.shiftName}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attendance Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">First In</p>
                <p className="font-semibold">{formatAttendanceTime(attendance.firstIn)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Last Out</p>
                <p className="font-semibold">{formatAttendanceTime(attendance.lastOut)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Work</p>
                <p className="font-semibold">{formatWorkMinutes(attendance.totalWorkMinutes)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Late</p>
                <p className="font-semibold">{formatLateMinutes(attendance.lateMinutes)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Early Exit</p>
                <p className="font-semibold">{formatLateMinutes(attendance.earlyExitMinutes)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <AttendanceStatusBadge status={attendance.status} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sessions */}
          <AttendanceSessionTable sessions={attendance.sessions} />

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-4">
              {attendance.sessions.map((session, index) => {
                const isIncomplete = !session.punchOut
                const isOvernight = !isIncomplete && isOvernightSession(session.punchIn, session.punchOut)
                return (
                  <div key={session.id} className="relative pl-6 pb-4 last:pb-0">
                    {/* Timeline line */}
                    {index < attendance.sessions.length - 1 && (
                      <div className="absolute left-1.75 top-3 bottom-0 w-0.5 bg-border" />
                    )}
                    
                    {/* Punch In */}
                    <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-background" />
                    <div className="mb-2">
                      <p className="text-sm font-medium text-foreground">{formatAttendanceTime(session.punchIn)}</p>
                      <p className="text-xs text-muted-foreground">Punch In</p>
                    </div>

                    {/* Punch Out */}
                    {session.punchOut && (
                      <>
                        <div className="absolute left-0 top-8 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatAttendanceTime(session.punchOut)}
                            {isOvernight && <span className="ml-1 text-amber-600 text-[10px]">(+1 day)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">Punch Out</p>
                        </div>
                      </>
                    )}

                    {!session.punchOut && (
                      <div className="absolute left-0 top-8 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-background" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
