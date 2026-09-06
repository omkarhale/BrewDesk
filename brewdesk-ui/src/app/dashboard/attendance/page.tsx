'use client'

import { useState } from 'react'
import { Clock, LogOut, LogIn, Timer, AlertCircle, RefreshCw } from 'lucide-react'
import { useAttendanceCalculation } from '@/hooks/useAttendance'
import { useEmployees } from '@/hooks/useAttendanceData'
import { formatAttendanceTime, formatWorkMinutes, formatLateMinutes, formatAttendanceDate } from '@/lib/utils'
import { AttendanceSummaryCard } from '@/features/attendance/components/AttendanceSummaryCard'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { AttendanceSessionTable } from '@/features/attendance/components/AttendanceSessionTable'
import { AttendanceDetailDrawer } from '@/features/attendance/components/AttendanceDetailDrawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { toast } from 'sonner'

export default function AttendanceDashboard() {
  const { employees, isLoading: employeesLoading } = useEmployees()
  const { attendance, isLoading, error, calculate, reset } = useAttendanceCalculation()
  
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleCalculate = async () => {
    if (!selectedEmployeeCode) {
      toast.error('Please select an employee')
      return
    }
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    await calculate(selectedEmployeeCode, selectedDate)
  }

  const handleReset = () => {
    reset()
    setSelectedEmployeeCode('')
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Attendance Dashboard</h2>
        <p className="mt-1 text-muted-foreground">Monitor employee attendance, working hours and attendance status.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployeeCode}
                onValueChange={setSelectedEmployeeCode}
                disabled={employeesLoading}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.employeeCode}>
                      {emp.employeeCode} - {emp.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleCalculate}
                disabled={isLoading || !selectedEmployeeCode || !selectedDate}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  'Calculate Attendance'
                )}
              </Button>
              {attendance && (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => handleCalculate()}
        />
      )}

      {/* Empty State */}
      {!attendance && !error && !isLoading && (
        <EmptyState
          icon={Clock}
          title="No attendance data"
          description="Select an employee and date to calculate attendance."
          action={{
            label: 'Calculate Attendance',
            onClick: handleCalculate,
          }}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-8 w-8 bg-muted rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-7 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance Results */}
      {attendance && !error && !isLoading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <AttendanceSummaryCard
              title="Early Exit"
              value={formatLateMinutes(attendance.earlyExitMinutes)}
              icon={AlertCircle}
              colorClass="text-orange-600"
            />
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-purple-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AttendanceStatusBadge status={attendance.status} />
              </CardContent>
            </Card>
          </div>

          {/* Shift Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shift Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee Code</p>
                  <p className="font-semibold mt-1">{attendance.employeeCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shift</p>
                  <p className="font-semibold mt-1">{attendance.shiftName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold mt-1">{formatAttendanceDate(attendance.attendanceDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <AttendanceStatusBadge status={attendance.status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <AttendanceSessionTable sessions={attendance.sessions} />

          {/* View Details Button */}
          <Button
            variant="outline"
            onClick={() => setDrawerOpen(true)}
            className="w-full"
          >
            View Full Details
          </Button>
        </div>
      )}

      {/* Detail Drawer */}
      <AttendanceDetailDrawer
        attendance={attendance}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}
