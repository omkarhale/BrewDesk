'use client'

import { useQuery } from '@tanstack/react-query'
import {
    AlertTriangle, Briefcase, Building2, CalendarDays, Clock,
    Coffee, Download, Eye, Filter, MoreHorizontal, RefreshCw,
    Search, Target, Timer, TrendingUp, UserCheck, Users,
} from 'lucide-react'
import { useCallback, useState } from 'react'

import { getMonthAttendance } from '@/api/attendance'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar'
import { AttendanceStatusBadge } from '@/features/attendance/components/AttendanceStatusBadge'
import { ALL_STATUSES, useAttendanceRecords } from '@/hooks/useAttendanceRecords'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeesQuery, useMyTeamQuery } from '@/hooks/useEmployeeManagement'
import { cn, formatAttendanceDate, formatAttendanceTime, formatWorkMinutes, getErrorMessage, getInitials } from '@/lib/utils'
import { AttendanceRecordsParams, AttendanceStatus, Employee } from '@/types/attendance'

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}
function defaultTo() {
  return new Date().toISOString().split('T')[0]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAttendanceTrend(records: any[]) {
  if (records.length < 2) return { trend: 'neutral' as const, percentage: 0 }
  const recent   = records.slice(-7)
  const previous = records.slice(-14, -7)
  const recentRate   = recent.length   > 0 ? recent.filter(r => r.status === 'PRESENT').length   / recent.length   : 0
  const previousRate = previous.length > 0 ? previous.filter(r => r.status === 'PRESENT').length / previous.length : recentRate
  const change = ((recentRate - previousRate) / (previousRate || 1)) * 100
  return {
    trend: change > 5 ? 'up' as const : change < -5 ? 'down' as const : 'neutral' as const,
    percentage: Math.abs(Math.round(change)),
  }
}

// ── Team Stats ───────────────────────────────────────────────────────────────

function TeamStatsCard({ members, records }: { members: Employee[]; records: any[] }) {
  const today = new Date().toISOString().split('T')[0]
  const totalMembers = members.length
  const presentToday = records.filter(r => r.attendanceDate === today && r.status === 'PRESENT').length
  const onLeaveToday = records.filter(r => r.attendanceDate === today && r.status === 'ON_LEAVE').length

  const stats = [
    { label: 'Total Team',      value: totalMembers,    icon: Users,    color: 'bg-gradient-to-br from-blue-500 to-blue-600',    bgColor: 'bg-blue-50 dark:bg-blue-900/10',    textColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Today',    value: presentToday,    icon: UserCheck, color: 'bg-gradient-to-br from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/10', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Attendance Rate', value: totalMembers > 0 ? `${Math.round((presentToday / totalMembers) * 100)}%` : '0%', icon: Target, color: 'bg-gradient-to-br from-violet-500 to-violet-600', bgColor: 'bg-violet-50 dark:bg-violet-900/10', textColor: 'text-violet-600 dark:text-violet-400' },
    { label: 'On Leave',        value: onLeaveToday,    icon: Coffee,   color: 'bg-gradient-to-br from-amber-500 to-amber-600',  bgColor: 'bg-amber-50 dark:bg-amber-900/10',  textColor: 'text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className={cn('border-0 shadow-sm', stat.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className={cn('text-2xl font-bold', stat.textColor)}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Team Member Cards ────────────────────────────────────────────────────────

function TeamMemberCards({
  members, selectedCode, onSelect, records,
}: {
  members: Employee[]
  selectedCode: string
  onSelect: (code: string) => void
  records: any[]
}) {
  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No team members found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Ask your HR admin to assign employees to your reporting line.
          </p>
        </CardContent>
      </Card>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Quick filter pills */}
      <div className="flex flex-wrap gap-2">
        <Button variant={selectedCode === '' ? 'default' : 'outline'} size="sm" onClick={() => onSelect('')} className="h-8">
          All Team <Badge variant="secondary" className="ml-1.5">{members.length}</Badge>
        </Button>
        {members.slice(0, 6).map((member) => (
          <Button key={member.id} variant={selectedCode === member.employeeCode ? 'default' : 'outline'} size="sm" onClick={() => onSelect(member.employeeCode)} className="h-8">
            {member.userName?.split(' ')[0] || member.employeeCode}
          </Button>
        ))}
        {members.length > 6 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {members.slice(6).map((member) => (
                <DropdownMenuItem key={member.id} onClick={() => onSelect(member.employeeCode)}>
                  {member.userName || member.employeeCode}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => {
          const memberRecords = records.filter(r => r.employeeCode === member.employeeCode)
          const todayRecord   = memberRecords.find(r => r.attendanceDate === today)
          const trend         = getAttendanceTrend(memberRecords.slice(-14))

          return (
            <Card
              key={member.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
                selectedCode === member.employeeCode && 'ring-2 ring-primary shadow-lg',
              )}
              onClick={() => onSelect(member.employeeCode)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className={cn(
                      'text-sm font-semibold',
                      member.active
                        ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      {getInitials(member.userName || member.employeeCode)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{member.userName || member.employeeCode}</p>
                        <p className="text-xs text-muted-foreground font-mono">{member.employeeCode}</p>
                      </div>
                      {todayRecord && (
                        <AttendanceStatusBadge status={todayRecord.status} className="scale-75 shrink-0" />
                      )}
                    </div>

                    {member.designation && (
                      <div className="flex items-center gap-1 mt-1">
                        <Briefcase className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{member.designation}</span>
                      </div>
                    )}

                    {member.departmentName && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{member.departmentName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{member.shiftName || 'No shift'}</span>
                      </div>
                      {trend.trend !== 'neutral' && (
                        <div className={cn(
                          'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full',
                          trend.trend === 'up'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                        )}>
                          <TrendingUp className={cn('h-3 w-3', trend.trend === 'down' && 'rotate-180')} />
                          {trend.percentage}%
                        </div>
                      )}
                    </div>

                    {todayRecord?.firstIn && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">In:</span>
                          <span className="font-mono font-medium">{formatAttendanceTime(todayRecord.firstIn)}</span>
                        </div>
                        {todayRecord.lastOut && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Out:</span>
                            <span className="font-mono font-medium">{formatAttendanceTime(todayRecord.lastOut)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Filters Panel ────────────────────────────────────────────────────────────

function FiltersPanel({
  empSearch, setEmpSearch, dateFrom, setDateFrom, dateTo, setDateTo,
  status, setStatus, onApply, isFetching, resultCount, scopedEmployees,
}: {
  empSearch: string
  setEmpSearch: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  status: AttendanceStatus | ''
  setStatus: (v: AttendanceStatus | '') => void
  onApply: () => void
  isFetching: boolean
  resultCount?: number
  scopedEmployees: Employee[]
}) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-900/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm">Attendance Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Employee</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search team member…"
                className="pl-9 h-9 text-sm"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onApply()}
                list="team-emp-codes"
              />
              <datalist id="team-emp-codes">
                {scopedEmployees.map((e) => (
                  <option key={e.id} value={e.employeeCode}>{e.userName}</option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">From Date</Label>
            <Input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">To Date</Label>
            <Input type="date" value={dateTo} min={dateFrom} max={defaultTo()} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Status</Label>
            <Select
              value={status === '' ? '__all' : status}
              onValueChange={(v) => setStatus(v === '__all' ? '' : v as AttendanceStatus)}
            >
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s.value || '__all'} value={s.value || '__all'}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            onClick={onApply}
            disabled={isFetching}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            {isFetching ? 'Searching…' : 'Search'}
          </Button>
          {resultCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {resultCount.toLocaleString()} record{resultCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Attendance Table ─────────────────────────────────────────────────────────

function AttendanceTable({
  data, isLoading, error, isFetching, allowedCodes, calEmp, setCalEmp,
}: {
  data: any
  isLoading: boolean
  error: any
  isFetching: boolean
  allowedCodes: Set<string> | null
  calEmp: string | null
  setCalEmp: (v: string | null) => void
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Failed to load attendance</h3>
          <p className="text-muted-foreground">{getErrorMessage(error)}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data?.content?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No attendance records</h3>
          <p className="text-muted-foreground">Adjust your filters or date range to find attendance data.</p>
        </CardContent>
      </Card>
    )
  }

  const rows: any[] = allowedCodes
    ? data.content.filter((r: any) => allowedCodes.has(r.employeeCode))
    : data.content

  return (
    <Card className={cn('transition-opacity', isFetching && 'opacity-60')}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Attendance Records</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Employee', 'Date', 'Shift', 'Times', 'Work Hours', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((record: any) => (
                <tr key={`${record.employeeCode}-${record.attendanceDate}`} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                          {getInitials(record.employeeName || record.employeeCode)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{record.employeeName || record.employeeCode}</p>
                        <p className="text-xs text-muted-foreground font-mono">{record.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{formatAttendanceDate(record.attendanceDate)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.attendanceDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-xs">{record.shiftName ?? '—'}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-8">In:</span>
                        <span className="font-mono font-medium">{formatAttendanceTime(record.firstIn)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-8">Out:</span>
                        <span className="font-mono font-medium">{formatAttendanceTime(record.lastOut)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold text-sm">{formatWorkMinutes(record.totalWorkMinutes)}</span>
                    </div>
                    {record.lateMinutes > 0 && (
                      <div className="text-xs text-amber-600 mt-1">Late: {record.lateMinutes}m</div>
                    )}
                  </td>
                  <td className="p-4">
                    <AttendanceStatusBadge status={record.status} />
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm" variant="ghost" className="h-8 px-3 text-xs"
                      onClick={() => setCalEmp(calEmp === record.employeeCode ? null : record.employeeCode)}
                    >
                      <CalendarDays className="h-3.5 w-3.5 mr-1" />
                      {calEmp === record.employeeCode ? 'Hide' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeamAttendancePage() {
  const { user } = useAuth()
  const isManager    = user?.role === 'REPORTING_MANAGER'
  const isManagement = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isAllowed    = isManager || isManagement

  const { data: allEmployees = [] } = useEmployeesQuery()
  const { data: myTeam = [] }       = useMyTeamQuery()
  const scopedEmployees = isManager ? myTeam : allEmployees

  const [empSearch, setEmpSearch] = useState('')
  const [dateFrom,  setDateFrom]  = useState(defaultFrom())
  const [dateTo,    setDateTo]    = useState(defaultTo())
  const [status,    setStatus]    = useState<AttendanceStatus | ''>('')
  const [calEmp,    setCalEmp]    = useState<string | null>(null)
  const [viewMode,  setViewMode]  = useState<'cards' | 'table'>('cards')

  const allowedCodes = isManager ? new Set(myTeam.map((m) => m.employeeCode)) : null

  const [committed, setCommitted] = useState<AttendanceRecordsParams>({
    dateFrom: defaultFrom(), dateTo: defaultTo(), page: 0, size: PAGE_SIZE,
  })

  const { data, isLoading, isFetching, error, refetch } = useAttendanceRecords(committed)

  const today    = new Date()
  const calYear  = today.getFullYear()
  const calMonth = today.getMonth() + 1

  const { data: calRecords = [], isLoading: calLoading } = useQuery({
    queryKey: ['attendance', 'team-cal', calEmp, calYear, calMonth],
    queryFn:  () => getMonthAttendance(calEmp!, calYear, calMonth),
    enabled:  !!calEmp,
  })

  const applyFilters = useCallback((pg = 0) => {
    const code = empSearch.trim() || undefined
    if (isManager && code && allowedCodes && !allowedCodes.has(code)) return
    setCommitted({
      employeeCode: code,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      status:   status   || undefined,
      page: pg,
      size: PAGE_SIZE,
    })
  }, [empSearch, dateFrom, dateTo, status, isManager, allowedCodes])

  const handleTeamSelect = (code: string) => {
    setEmpSearch(code)
    setCalEmp(null)
    setCommitted({
      employeeCode: code || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      status:   status   || undefined,
      page: 0,
      size: PAGE_SIZE,
    })
  }

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-6">
            <Users className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view team attendance. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  const totalPages   = data?.totalPages  ?? 0
  const currentPage  = data?.pageNumber  ?? 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Gradient header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 p-8 text-white">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Team Attendance</h1>
            <p className="text-blue-100 text-lg">
              {isManager
                ? `Monitor ${myTeam.length} direct report${myTeam.length !== 1 ? 's' : ''}`
                : 'Organisation-wide attendance tracking'}
            </p>
          </div>
          <Button
            variant="secondary" size="sm"
            onClick={() => refetch()} disabled={isFetching}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
        <div className="absolute -top-4  -right-4  h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* ── Stats ── */}
      <TeamStatsCard members={scopedEmployees} records={data?.content ?? []} />

      {/* ── Team cards (managers only) ── */}
      {isManager && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle>Your Team</CardTitle>
                <Badge variant="secondary">{myTeam.length}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')}>Cards</Button>
                <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>Table</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TeamMemberCards
              members={myTeam}
              selectedCode={empSearch}
              onSelect={handleTeamSelect}
              records={data?.content ?? []}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Filters ── */}
      <FiltersPanel
        empSearch={empSearch} setEmpSearch={setEmpSearch}
        dateFrom={dateFrom}   setDateFrom={setDateFrom}
        dateTo={dateTo}       setDateTo={setDateTo}
        status={status}       setStatus={setStatus}
        onApply={() => applyFilters(0)}
        isFetching={isFetching}
        resultCount={data?.totalElements}
        scopedEmployees={scopedEmployees}
      />

      {/* ── Records + optional calendar sidebar ── */}
      <div className={cn('grid gap-6', calEmp && 'lg:grid-cols-[1fr_400px]')}>
        <AttendanceTable
          data={data} isLoading={isLoading} error={error}
          isFetching={isFetching} allowedCodes={allowedCodes}
          calEmp={calEmp} setCalEmp={setCalEmp}
        />

        {calEmp && (
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{calEmp}</CardTitle>
                  <CardDescription>
                    {scopedEmployees.find(e => e.employeeCode === calEmp)?.userName}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCalEmp(null)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AttendanceCalendar records={calRecords} isLoading={calLoading} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => applyFilters(currentPage - 1)} disabled={data?.first || isFetching}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyFilters(currentPage + 1)} disabled={data?.last || isFetching}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
