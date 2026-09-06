'use client'

import { useState, useCallback } from 'react'
import { Users, Search, RefreshCw, CalendarDays } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeesQuery } from '@/hooks/useEmployeeManagement'
import { useAttendanceRecords } from '@/hooks/useAttendanceRecords'
import { getErrorMessage, formatAttendanceDate, formatAttendanceTime, formatWorkMinutes } from '@/lib/utils'
import { AttendanceStatus, AttendanceRecordsParams } from '@/types/attendance'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getMonthAttendance } from '@/api/attendance'
import { AttendanceCalculationResponse } from '@/types/attendance'
import { useQuery } from '@tanstack/react-query'
import { ALL_STATUSES } from '@/hooks/useAttendanceRecords'

const PAGE_SIZE = 15

function defaultFrom() {
  const d = new Date(); d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}
function defaultTo() { return new Date().toISOString().split('T')[0] }

export default function TeamAttendancePage() {
  const { user } = useAuth()
  const isAllowed = user?.role === 'REPORTING_MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const { data: employees = [] } = useEmployeesQuery()

  // ── Filters ───────────────────────────────────────────────────────────────
  const [empSearch,  setEmpSearch]  = useState('')
  const [dateFrom,   setDateFrom]   = useState(defaultFrom())
  const [dateTo,     setDateTo]     = useState(defaultTo())
  const [status,     setStatus]     = useState<AttendanceStatus | ''>('')
  const [page,       setPage]       = useState(0)
  const [calEmp,     setCalEmp]     = useState<string | null>(null)

  const [committed, setCommitted] = useState<AttendanceRecordsParams>({
    dateFrom: defaultFrom(), dateTo: defaultTo(), page: 0, size: PAGE_SIZE,
  })

  const { data, isLoading, isFetching, error, refetch } = useAttendanceRecords(committed)

  // Calendar month data for selected employee
  const today = new Date()
  const calYear = today.getFullYear()
  const calMonth = today.getMonth() + 1

  const { data: calRecords = [], isLoading: calLoading } = useQuery({
    queryKey: ['attendance', 'team-cal', calEmp, calYear, calMonth],
    queryFn: () => getMonthAttendance(calEmp!, calYear, calMonth),
    enabled: !!calEmp,
  })

  const applyFilters = useCallback((pg = 0) => {
    setPage(pg)
    setCommitted({
      employeeCode: empSearch.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: status || undefined,
      page: pg,
      size: PAGE_SIZE,
    })
  }, [empSearch, dateFrom, dateTo, status])

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-base font-semibold">Access denied</h3>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view team attendance.</p>
      </div>
    )
  }

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.pageNumber ?? 0

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Attendance</h2>
          <p className="mt-1 text-muted-foreground">View attendance records for your team members.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Employee Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. EMP001"
                  className="pl-9"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters(0)}
                  list="team-emp-codes"
                />
                <datalist id="team-emp-codes">
                  {employees.map((e) => <option key={e.id} value={e.employeeCode} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>From Date</Label>
              <Input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>To Date</Label>
              <Input type="date" value={dateTo} min={dateFrom} max={defaultTo()} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status === '' ? '__all' : status} onValueChange={(v) => setStatus(v === '__all' ? '' : v as AttendanceStatus)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s.value || '__all'} value={s.value || '__all'}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => applyFilters(0)} disabled={isFetching} className="px-6">
              <Search className="h-4 w-4" />Search
            </Button>
            {data && <span className="ml-auto text-xs text-muted-foreground">{data.totalElements} records</span>}
          </div>
        </CardContent>
      </Card>

      {/* Results + optional calendar */}
      <div className={calEmp ? 'grid gap-5 xl:grid-cols-[1fr_380px]' : ''}>
        {/* Records table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-muted-foreground">{getErrorMessage(error)}</div>
          ) : !data?.content?.length ? (
            <div className="p-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No records found</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust the filters or date range.</p>
            </div>
          ) : (
            <table className={`w-full ${isFetching ? 'opacity-60' : ''}`}>
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Employee', 'Date', 'Shift', 'First In', 'Last Out', 'Work', 'Status', ''].map(h => (
                    <th key={h} className="text-left p-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.content.map((r) => (
                  <tr key={`${r.employeeCode}-${r.attendanceDate}`} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-sm font-semibold">{r.employeeCode}</td>
                    <td className="p-3 text-sm text-muted-foreground">{formatAttendanceDate(r.attendanceDate)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.shiftName}</td>
                    <td className="p-3 font-mono text-sm">{formatAttendanceTime(r.firstIn)}</td>
                    <td className="p-3 font-mono text-sm">{formatAttendanceTime(r.lastOut)}</td>
                    <td className="p-3 text-sm font-medium">{formatWorkMinutes(r.totalWorkMinutes)}</td>
                    <td className="p-3"><AttendanceStatusBadge status={r.status} /></td>
                    <td className="p-3">
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 px-2 text-xs text-blue-600"
                        onClick={() => setCalEmp(calEmp === r.employeeCode ? null : r.employeeCode)}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {calEmp === r.employeeCode ? 'Hide' : 'Calendar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Inline calendar for selected employee */}
        {calEmp && (
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{calEmp} — Calendar</CardTitle>
              <CardDescription className="text-xs">Monthly attendance view</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceCalendar
                records={calRecords}
                isLoading={calLoading}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => applyFilters(currentPage - 1)} disabled={data?.first || isFetching}>← Prev</Button>
            <Button variant="outline" size="sm" onClick={() => applyFilters(currentPage + 1)} disabled={data?.last || isFetching}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
