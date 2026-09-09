'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Search, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceComparisonPanel } from '@/features/attendance/components/regularization/AttendanceComparisonPanel'
import { RegularizationStatusBadge } from '@/features/attendance/components/regularization/RegularizationStatusBadge'
import { getRegularizationTypeLabel } from '@/features/attendance/components/regularization/RegularizationTypeBadge'
import { useAllRegularizations, useRegularizationDetail } from '@/hooks/useRegularization'
import { useAuth } from '@/hooks/useAuth'
import { isManagement } from '@/types/auth'
import { RegularizationStatus, RegularizationType } from '@/types/attendance'
import { formatAttendanceDate } from '@/lib/utils'

function today() { return new Date().toISOString().split('T')[0] }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }

const TYPE_OPTIONS: { value: RegularizationType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'MISSED_PUNCH', label: 'Missed Punch' },
  { value: 'INCORRECT_PUNCH', label: 'Incorrect Punch' },
  { value: 'LATE_ARRIVAL', label: 'Late Arrival' },
  { value: 'EARLY_EXIT', label: 'Early Exit' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'FULL_DAY', label: 'Full Day' },
]

function DetailDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useRegularizationDetail(id)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg h-full bg-card shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <h3 className="text-[14px] font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Request Detail
          </h3>
          <button type="button" onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            : data && (
              <>
                {/* Header info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-foreground">
                      {data.employeeName ?? data.employeeCode}
                    </span>
                    <span className="font-mono text-[12px] text-muted-foreground">{data.employeeCode}</span>
                    <RegularizationStatusBadge status={data.status} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {getRegularizationTypeLabel(data.type)} · {formatAttendanceDate(data.attendanceDate)}
                  </p>
                  {data.submittedAt && (
                    <p className="text-[12px] text-muted-foreground">
                      Submitted {format(new Date(data.submittedAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  )}
                </div>

                <div className="card-flat p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                  <p className="text-[13px]">{data.reason}</p>
                </div>

                <AttendanceComparisonPanel request={data} />

                {/* Review info */}
                {(data.status === 'APPROVED' || data.status === 'REJECTED') && (
                  <div className="card-flat p-3 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review</p>
                    <p className="text-[13px]">
                      <span className="text-muted-foreground">By: </span>
                      {data.reviewedByName ?? '—'}
                    </p>
                    {data.reviewedAt && (
                      <p className="text-[13px]">
                        <span className="text-muted-foreground">At: </span>
                        {format(new Date(data.reviewedAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    )}
                    {data.rejectionReason && (
                      <p className="text-[13px]">
                        <span className="text-muted-foreground">Reason: </span>
                        {data.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default function AdminRegularizationPage() {
  const { user } = useAuth()
  if (!isManagement(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <Shield className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  const [empCode, setEmpCode]     = useState('')
  const [dateFrom, setDateFrom]   = useState(daysAgo(30))
  const [dateTo, setDateTo]       = useState(today())
  const [status, setStatus]       = useState<RegularizationStatus | ''>('')
  const [type, setType]           = useState<RegularizationType | ''>('')
  const [page, setPage]           = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [committed, setCommitted] = useState({
    employeeCode: '', dateFrom: daysAgo(30), dateTo: today(),
    status: '' as RegularizationStatus | '',
    type:   '' as RegularizationType | '',
    page: 0, size: 20,
  })

  const { data, isLoading, isFetching } = useAllRegularizations({
    ...committed,
    status:       committed.status   || undefined,
    type:         committed.type     || undefined,
    employeeCode: committed.employeeCode || undefined,
  })

  const search = (p = 0) => {
    setPage(p)
    setCommitted({ employeeCode: empCode.trim(), dateFrom, dateTo, status, type, page: p, size: 20 })
  }

  const clear = () => {
    setEmpCode(''); setDateFrom(daysAgo(30)); setDateTo(today())
    setStatus(''); setType(''); setPage(0)
    setCommitted({ employeeCode: '', dateFrom: daysAgo(30), dateTo: today(), status: '', type: '', page: 0, size: 20 })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {selectedId !== null && (
        <DetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <div>
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}>
          Regularization Monitor
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          View and monitor all regularization requests across the organisation.
        </p>
      </div>

      {/* Filters */}
      <div className="card-flat p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Employee Code</Label>
            <Input className="text-[13px] h-8" placeholder="EMP001" value={empCode}
              onChange={e => setEmpCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search(0)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">From</Label>
            <Input type="date" className="text-[13px] h-8" value={dateFrom} max={dateTo}
              onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">To</Label>
            <Input type="date" className="text-[13px] h-8" value={dateTo} min={dateFrom} max={today()}
              onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Status</Label>
            <Select value={status || '__all'}
              onValueChange={v => setStatus(v === '__all' ? '' : v as RegularizationStatus)}>
              <SelectTrigger className="text-[13px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Type</Label>
            <Select value={type || '__all'}
              onValueChange={v => setType(v === '__all' ? '' : v as RegularizationType)}>
              <SelectTrigger className="text-[13px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(o => (
                  <SelectItem key={o.value || '__all'} value={o.value || '__all'}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="gap-1.5 text-[13px] h-8" onClick={() => search(0)} disabled={isFetching}>
            <Search className="h-3.5 w-3.5" /> Search
          </Button>
          <Button size="sm" variant="ghost" className="text-[13px] h-8" onClick={clear}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
          {!isLoading && data && (
            <span className="ml-auto text-[12px] text-muted-foreground">
              {data.totalElements} result{data.totalElements !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`card-flat overflow-hidden transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header-rippling">
                {['Employee','Date','Type','Current','Status','Reviewed By','Submitted'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {[1,2,3,4,5,6,7].map(j => <td key={j} className="px-4 py-3"><Skeleton className="h-3.5 w-20"/></td>)}
                    </tr>
                  ))
                : !data?.content?.length
                ? <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">No requests found.</td></tr>
                : data.content.map(r => (
                    <tr key={r.id}
                      className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedId(r.id)}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium">{r.employeeName ?? '—'}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{r.employeeCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] whitespace-nowrap">{formatAttendanceDate(r.attendanceDate)}</td>
                      <td className="px-4 py-3 text-[13px]">{getRegularizationTypeLabel(r.type)}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.currentAttendanceStatus ?? '—'}</td>
                      <td className="px-4 py-3"><RegularizationStatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.reviewedByName ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                        {r.submittedAt ? format(new Date(r.submittedAt), 'dd MMM yyyy') : '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[12px] text-muted-foreground">
            Page {data.pageNumber + 1} of {data.totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={data.first}
              onClick={() => search(page - 1)}><ChevronLeft className="h-4 w-4"/>Prev</Button>
            <Button variant="outline" size="sm" disabled={data.last}
              onClick={() => search(page + 1)}>Next<ChevronRight className="h-4 w-4"/></Button>
          </div>
        </div>
      )}
    </div>
  )
}
