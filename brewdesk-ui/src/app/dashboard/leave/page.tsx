'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
    useApplyLeave, useCancelLeave,
    useEligibleLeaveTypes, useMyLeaveBalances, useMyLeaveRequests,
} from '@/hooks/useLeave'
import { cn } from '@/lib/utils'
import { ApplyLeaveFormValues, applyLeaveSchema } from '@/schemas/leave.schema'
import { EmployeeLeaveBalance, LEAVE_STATUS_CONFIG, LeaveRequest, LeaveType } from '@/types/leave'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
    Ban,
    CalendarDays,
    CheckCircle2,
    ChevronLeft, ChevronRight,
    Clock,
    FileText,
    Loader2,
    Plus,
    TrendingUp,
    Wallet,
    X,
    XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

// ── Status Badge ──────────────────────────────────────────────────────────────
function LeaveStatusBadge({ status }: { status: string }) {
  const cfg = LEAVE_STATUS_CONFIG[status as keyof typeof LEAVE_STATUS_CONFIG]
  if (!cfg) return <span className="text-xs">{status}</span>
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', cfg.pill)}>
      {cfg.label}
    </span>
  )
}

// ── Balance Card ──────────────────────────────────────────────────────────────
function BalanceCard({ balance }: { balance: EmployeeLeaveBalance }) {
  const pct = balance.accrued + balance.openingBalance > 0
    ? Math.round((balance.available / (balance.accrued + balance.openingBalance + balance.adjusted)) * 100)
    : 0
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/10 dark:to-blue-900/10" />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{balance.leaveTypeCode}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{balance.leaveTypeName}</p>
          </div>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
            balance.paid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                         : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
            {balance.paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{balance.available.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Available days</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[11px] text-muted-foreground">Used: <span className="font-medium text-foreground">{balance.used.toFixed(2)}</span></p>
            <p className="text-[11px] text-muted-foreground">Accrued: <span className="font-medium text-foreground">{balance.accrued.toFixed(2)}</span></p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-muted/40">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Apply Leave Form ──────────────────────────────────────────────────────────
function ApplyLeaveForm({ leaveTypes, onClose }: { leaveTypes: LeaveType[]; onClose: () => void }) {
  const apply = useApplyLeave()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ApplyLeaveFormValues>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: { dayDuration: 'FULL_DAY' },
  })

  const selectedTypeId = watch('leaveTypeId')
  const selectedType = leaveTypes.find(t => t.id === selectedTypeId)

  const onSubmit = async (data: ApplyLeaveFormValues) => {
    await apply.mutateAsync({
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      dayDuration: data.dayDuration,
      reason: data.reason,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Leave Type */}
      <div className="space-y-1.5">
        <Label>Leave Type <span className="text-destructive">*</span></Label>
        <Select onValueChange={(v) => setValue('leaveTypeId', Number(v), { shouldValidate: true })}>
          <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select leave type" /></SelectTrigger>
          <SelectContent>
            {leaveTypes.filter(t => t.active).map(t => (
              <SelectItem key={t.id} value={String(t.id)}>
                <span className="font-mono mr-2 text-xs text-muted-foreground">{t.code}</span>{t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.leaveTypeId && <p className="text-xs text-destructive">{errors.leaveTypeId.message}</p>}
      </div>

      {/* Date Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
          <Input id="startDate" type="date" {...register('startDate')} className="text-[13px]" max={watch('endDate') || undefined} />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date <span className="text-destructive">*</span></Label>
          <Input id="endDate" type="date" {...register('endDate')} className="text-[13px]" min={watch('startDate') || undefined} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </div>
      </div>

      {/* Half Day */}
      {selectedType?.halfDayAllowed && (
        <div className="space-y-1.5">
          <Label>Duration</Label>
          <div className="flex flex-wrap gap-2">
            {(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'] as const).map(d => (
              <button key={d} type="button"
                onClick={() => setValue('dayDuration', d)}
                className={cn('h-8 rounded-md border px-3 text-[13px] transition-colors',
                  watch('dayDuration') === d
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                    : 'border-border bg-card hover:bg-muted')}>
                {d === 'FULL_DAY' ? 'Full Day' : d === 'FIRST_HALF' ? 'First Half' : 'Second Half'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason</Label>
        <textarea id="reason" rows={3}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Briefly explain the reason for leave…"
          {...register('reason')} />
        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
      </div>

      {selectedType?.documentRequired && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <FileText className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400">Supporting document required. Upload after submission.</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} className="h-8 text-[13px]">Cancel</Button>
        <Button type="submit" disabled={apply.isPending} className="h-8 gap-1.5 text-[13px]">
          {apply.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Submitting…</> : 'Submit Request'}
        </Button>
      </div>
    </form>
  )
}

// ── Request Row ───────────────────────────────────────────────────────────────
function RequestRow({ req, onCancel }: { req: LeaveRequest; onCancel: (id: number) => void }) {
  const cancel = useCancelLeave()
  return (
    <tr className="border-t border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-[13px] font-medium">{req.leaveTypeName}</td>
      <td className="px-4 py-3 text-[13px]">
        {format(new Date(req.startDate + 'T00:00:00'), 'dd MMM yyyy')}
        {req.startDate !== req.endDate && <> → {format(new Date(req.endDate + 'T00:00:00'), 'dd MMM yyyy')}</>}
      </td>
      <td className="px-4 py-3 text-[13px] text-center">{req.totalDays}</td>
      <td className="px-4 py-3"><LeaveStatusBadge status={req.status} /></td>
      <td className="px-4 py-3 text-[12px] text-muted-foreground">
        {req.reason ? req.reason.slice(0, 40) + (req.reason.length > 40 ? '…' : '') : '—'}
      </td>
      <td className="px-4 py-3">
        {req.status === 'PENDING' && (
          <Button variant="ghost" size="sm" className="h-7 text-[12px] text-destructive hover:bg-red-50"
            disabled={cancel.isPending}
            onClick={() => onCancel(req.id)}>
            {cancel.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
          </Button>
        )}
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeaveDashboardPage() {
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)

  const { data: balances = [], isLoading: balLoading } = useMyLeaveBalances()
  const { data: leaveTypes = [] } = useEligibleLeaveTypes()
  const { data: requests, isLoading: reqLoading } = useMyLeaveRequests(page)
  const cancel = useCancelLeave()

  const stats = [
    { label: 'Pending', value: requests?.content.filter(r => r.status === 'PENDING').length ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
    { label: 'Approved', value: requests?.content.filter(r => r.status === 'APPROVED').length ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
    { label: 'Rejected', value: requests?.content.filter(r => r.status === 'REJECTED').length ?? 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
    { label: 'Total Taken', value: balances.reduce((s, b) => s + b.used, 0).toFixed(2), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-blue-600 to-violet-700 p-8 text-white">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Leave</h1>
            <p className="text-teal-100 text-base">Track your balances, apply for leave and view request history.</p>
          </div>
          <Button onClick={() => setShowForm(true)}
            className="bg-white/15 border-white/30 text-white hover:bg-white/25 border gap-1.5"
            variant="outline" size="sm">
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        </div>
        <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} className={cn('border-0 shadow-sm', s.bg)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={cn('h-8 w-8', s.color)} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Balance cards */}
      <div>
        <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-teal-600" /> Leave Balances
        </h2>
        {balLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : balances.length === 0 ? (
          <Card className="border-dashed"><CardContent className="p-8 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground">No leave balances assigned yet. Contact HR.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map(b => <BalanceCard key={b.id} balance={b} />)}
          </div>
        )}
      </div>

      {/* Apply form */}
      {showForm && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-[15px]">New Leave Request</CardTitle>
              <CardDescription className="text-[12px]">Fill in the details below to submit your request.</CardDescription>
            </div>
            <button onClick={() => setShowForm(false)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="p-5">
            <ApplyLeaveForm leaveTypes={leaveTypes} onClose={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      {/* Request history */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-[15px] flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" /> My Leave Requests
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {['Type', 'Dates', 'Days', 'Status', 'Reason', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reqLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                : !requests?.content.length
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                      No leave requests yet.{' '}
                      <button className="text-teal-600 underline" onClick={() => setShowForm(true)}>Apply now.</button>
                    </td></tr>
                  : requests.content.map(r => (
                      <RequestRow key={r.id} req={r} onCancel={(id) => cancel.mutate(id)} />
                    ))
              }
            </tbody>
          </table>
        </div>
        {!reqLoading && requests && requests.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-[12px] text-muted-foreground">Page {requests.pageNumber + 1} of {requests.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={requests.first} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={requests.last} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
