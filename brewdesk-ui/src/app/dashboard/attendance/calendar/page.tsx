'use client'

import { useState } from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeesQuery } from '@/hooks/useEmployeeManagement'
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar'
import { AttendanceSessionTable } from '@/features/attendance/components/AttendanceSessionTable'
import { AttendanceSummaryCard } from '@/features/attendance/components/AttendanceSummaryCard'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { getMonthAttendance, calculateAttendance } from '@/api/attendance'
import { AttendanceCalculationResponse } from '@/types/attendance'
import {
  formatAttendanceDate, formatAttendanceTime, formatWorkMinutes, formatLateMinutes,
} from '@/lib/utils'
import { AlertCircle, LogIn, LogOut, Timer } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function AttendanceCalendarPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const { data: employees = [], isLoading: empsLoading } = useEmployeesQuery()

  const today = new Date()
  const [selectedCode, setSelectedCode] = useState<string>('')
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate,   setSelectedDate]   = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceCalculationResponse | null>(null)
  const [isCalculating,  setIsCalculating]  = useState(false)

  const { data: records = [], isLoading: calLoading, refetch } = useQuery({
    queryKey: ['attendance', 'admin-cal', selectedCode, year, month],
    queryFn:  () => getMonthAttendance(selectedCode, year, month),
    enabled:  !!selectedCode,
  })

  const handleDateClick = async (
    date: string,
    record: AttendanceCalculationResponse | null,
  ) => {
    const todayIso = today.toISOString().split('T')[0]
    if (date > todayIso) return
    setSelectedDate(date)
    if (record) { setSelectedRecord(record); return }
    if (!selectedCode) return
    setIsCalculating(true)
    try {
      const result = await calculateAttendance(selectedCode, date)
      setSelectedRecord(result)
      refetch()
    } catch {
      toast.error('Could not calculate attendance for this date.')
    } finally {
      setIsCalculating(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <CalendarDays className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-base font-semibold">Access denied</h3>
        <p className="text-sm text-muted-foreground mt-1">Only admins can view the attendance calendar.</p>
      </div>
    )
  }

  const selectedEmp = employees.find(e => e.employeeCode === selectedCode)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Calendar</h2>
          <p className="mt-1 text-muted-foreground">
            View any employee&apos;s monthly attendance at a glance, greytHR-style.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={calLoading || !selectedCode}>
          <RefreshCw className={`h-4 w-4 ${calLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Employee selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Select Employee</Label>
              <Select value={selectedCode} onValueChange={setSelectedCode} disabled={empsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee to view their calendar" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.employeeCode}>
                      <span className="font-mono font-semibold">{e.employeeCode}</span>
                      {e.designation && <span className="ml-2 text-muted-foreground text-xs">— {e.designation}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEmp?.shiftName && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-2.5">
                <span className="text-sm text-muted-foreground">Shift:</span>
                <span className="text-sm font-semibold">{selectedEmp.shiftName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-600" />
            {selectedCode ? `${selectedCode} — Monthly View` : 'Monthly View'}
          </CardTitle>
          <CardDescription>
            Click any past date to see detailed breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCode ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Select an employee above to view their calendar</p>
            </div>
          ) : (
            <AttendanceCalendar
              records={records}
              isLoading={calLoading}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              shiftCode={selectedEmp?.shiftName?.substring(0, 2).toUpperCase()}
            />
          )}
        </CardContent>
      </Card>

      {/* Selected date detail */}
      {(selectedDate || isCalculating) && selectedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isCalculating
                ? 'Calculating…'
                : selectedRecord
                ? `${selectedCode} — ${formatAttendanceDate(selectedDate!)}`
                : `No record for ${selectedDate}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCalculating ? (
              <div className="grid gap-3 sm:grid-cols-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : selectedRecord ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border px-4 py-2.5">
                  <AttendanceStatusBadge status={selectedRecord.status} />
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm">{selectedRecord.shiftName}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <AttendanceSummaryCard title="First In"   value={formatAttendanceTime(selectedRecord.firstIn)}              icon={LogIn}       colorClass="text-emerald-600" />
                  <AttendanceSummaryCard title="Last Out"   value={formatAttendanceTime(selectedRecord.lastOut)}              icon={LogOut}      colorClass="text-blue-600" />
                  <AttendanceSummaryCard title="Total Work" value={formatWorkMinutes(selectedRecord.totalWorkMinutes)}        icon={Timer}       colorClass="text-amber-600" />
                  <AttendanceSummaryCard title="Late"       value={formatLateMinutes(selectedRecord.lateMinutes)}            icon={AlertCircle} colorClass="text-red-500" />
                </div>
                <AttendanceSessionTable sessions={selectedRecord.sessions} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attendance was calculated for this date.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
