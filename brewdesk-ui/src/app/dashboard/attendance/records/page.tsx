'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AttendanceRecordsTable } from '@/features/attendance/components/AttendanceRecordsTable'
import { ALL_STATUSES, useAttendanceRecords } from '@/hooks/useAttendanceRecords'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeesQuery } from '@/hooks/useEmployeeManagement'
import { getErrorMessage } from '@/lib/utils'
import { AttendanceRecordsParams, AttendanceStatus } from '@/types/attendance'
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    RefreshCw,
    Search,
    X,
} from 'lucide-react'
import { useCallback, useState } from 'react'

const PAGE_SIZE = 20

// Default date range: last 30 days
function defaultDateFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}
function defaultDateTo(): string {
  return new Date().toISOString().split('T')[0]
}

export default function AttendanceRecordsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // ── Filter state ────────────────────────────────────────────────────────────
  const [employeeCode, setEmployeeCode] = useState('')
  const [dateFrom, setDateFrom] = useState(defaultDateFrom())
  const [dateTo, setDateTo] = useState(defaultDateTo())
  const [status, setStatus] = useState<AttendanceStatus | ''>('')
  const [page, setPage] = useState(0)

  // Committed params — only applied when Search is clicked or filters reset
  const [committedParams, setCommittedParams] = useState<AttendanceRecordsParams>({
    employeeCode: undefined,
    dateFrom: defaultDateFrom(),
    dateTo: defaultDateTo(),
    status: undefined,
    page: 0,
    size: PAGE_SIZE,
  })

  const { data, isLoading, isFetching, error, refetch } = useAttendanceRecords(committedParams)

  // Keep employee list for the code dropdown hint
  const { data: employees = [] } = useEmployeesQuery()

  // ── Handlers ────────────────────────────────────────────────────────────────
  const applyFilters = useCallback(
    (overridePage = 0) => {
      setPage(overridePage)
      setCommittedParams({
        employeeCode: employeeCode.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status || undefined,
        page: overridePage,
        size: PAGE_SIZE,
      })
    },
    [employeeCode, dateFrom, dateTo, status],
  )

  const clearFilters = () => {
    const from = defaultDateFrom()
    const to = defaultDateTo()
    setEmployeeCode('')
    setDateFrom(from)
    setDateTo(to)
    setStatus('')
    setPage(0)
    setCommittedParams({
      dateFrom: from,
      dateTo: to,
      page: 0,
      size: PAGE_SIZE,
    })
  }

  const goToPage = (newPage: number) => {
    setPage(newPage)
    setCommittedParams((prev) => ({ ...prev, page: newPage }))
  }

  const hasActiveFilters =
    !!employeeCode.trim() ||
    dateFrom !== defaultDateFrom() ||
    dateTo !== defaultDateTo() ||
    !!status

  // ── Access guard ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <ClipboardList className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view attendance records.
        </p>
      </div>
    )
  }

  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0
  const currentPage = data?.pageNumber ?? 0

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Records</h2>
          <p className="mt-1 text-muted-foreground">
            Search and filter calculated attendance records across all employees.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Employee Code search */}
            <div className="space-y-1.5">
              <Label htmlFor="rec-emp">Employee Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="rec-emp"
                  placeholder="e.g. EMP001"
                  className="pl-9"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters(0)}
                  list="employee-codes"
                />
                <datalist id="employee-codes">
                  {employees.map((e) => (
                    <option key={e.id} value={e.employeeCode} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <Label htmlFor="rec-from">From Date</Label>
              <Input
                id="rec-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <Label htmlFor="rec-to">To Date</Label>
              <Input
                id="rec-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="rec-status">Status</Label>
              <Select
                value={status === '' ? '__all' : status}
                onValueChange={(v) => setStatus(v === '__all' ? '' : v as AttendanceStatus)}
              >
                <SelectTrigger id="rec-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value === '' ? '__all' : s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={() => applyFilters(0)} disabled={isFetching} className="px-6">
              <Search className="h-4 w-4" />
              Search
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} disabled={isFetching}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
            {!isLoading && totalElements > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {totalElements.toLocaleString()} record{totalElements !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <AttendanceRecordsTable
        records={data?.content}
        isLoading={isLoading}
        isFetching={isFetching && !isLoading}
        error={error ? new Error(getErrorMessage(error)) : null}
        onRetry={() => refetch()}
      />

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={data?.first || isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(
                (i) =>
                  i === 0 ||
                  i === totalPages - 1 ||
                  Math.abs(i - currentPage) <= 1,
              )
              .reduce<(number | 'ellipsis')[]>((acc, i, idx, arr) => {
                if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                acc.push(i)
                return acc
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="text-muted-foreground text-sm px-1">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="w-9 px-0"
                    onClick={() => goToPage(item as number)}
                    disabled={isFetching}
                  >
                    {(item as number) + 1}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={data?.last || isFetching}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
