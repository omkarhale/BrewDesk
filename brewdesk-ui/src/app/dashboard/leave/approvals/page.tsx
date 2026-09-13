'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  CheckCircle2, XCircle, Users, Loader2, Clock, CalendarDays,
  ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react'
import { useManagerPendingRequests, useManagerAllRequests, useApproveLeave, useRejectLeave } from '@/hooks/useLeave'
import { reviewLeaveSchema, ReviewLeaveFormValues } from '@/schemas/leave.schema'
import { LeaveRequest, LEAVE_STATUS_CONFIG } from '@/types/leave'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Status badge ──────────────────────────────────────────────────────────────
function LeaveStatusBadge({ status }: { status: string }) {
  const cfg = LEAVE_STATUS_CONFIG[status as keyof typeof LEAVE_STATUS_CONFIG]
  if (!cfg) return <Badge variant="secondary">{status}</Badge>
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', cfg.pill)}>{cfg.label}</span>
}

// ── Review Dialog ─────────────────────────────────────────────────────────────
function ReviewDialog({
  request, action, onClose,
}: { request: LeaveRequest; action: 'approve' | 'reject'; onClose: () => void }) {
  const approve = useApproveLeave()
  const reject  = useRejectLeave()

  const { register, handleSubmit, formState: { errors } } = useForm<ReviewLeaveFormValues>({
    resolver: zodResolver(reviewLeaveSchema),
  })

  const isApprove = action === 'approve'
  const mutation  = isApprove ? approve : reject

  const onSubmit = async (data: ReviewLeaveFormValues) => {
    const args = { id: request.id, remarks: data.remarks }
    if (isApprove) { await approve.mutateAsync(args) } else { await reject.mutateAsync(args) }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className={cn('rounded-t-xl', isApprove ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
          <CardTitle className={cn('flex items-center gap-2 text-base', isApprove ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {isApprove ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {isApprove ? 'Approve' : 'Reject'} Leave Request
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[13px] space-y-1">
            <p className="font-semibold">{request.employeeName}</p>
            <p className="text-muted-foreground">{request.leaveTypeName} · {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}</p>
            <p className="text-muted-foreground">
              {format(new Date(request.startDate + 'T00:00:00'), 'dd MMM yyyy')}
              {request.startDate !== request.endDate && <> – {format(new Date(request.endDate + 'T00:00:00'), 'dd MMM yyyy')}</>}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Remarks {!isApprove && <span className="text-muted-foreground">(optional)</span>}</label>
              <textarea rows={3} {...register('remarks')}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={isApprove ? 'Optional approval note…' : 'Reason for rejection…'} />
              {errors.remarks && <p className="text-xs text-destructive">{errors.remarks.message}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="h-8 text-[13px]">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}
                className={cn('h-8 gap-1.5 text-[13px]', isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-500 hover:bg-red-600')}>
                {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isApprove ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ request, onReview }: {
  request: LeaveRequest
  onReview: (r: LeaveRequest, action: 'approve' | 'reject') => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{request.employeeName}</p>
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{request.employeeCode}</span>
              <LeaveStatusBadge status={request.status} />
            </div>
            <p className="text-[13px] text-teal-600 dark:text-teal-400 font-medium mt-1">{request.leaveTypeName}</p>
            <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(request.startDate + 'T00:00:00'), 'dd MMM yyyy')}
                {request.startDate !== request.endDate && <> – {format(new Date(request.endDate + 'T00:00:00'), 'dd MMM yyyy')}</>}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
              </span>
            </div>
            {request.reason && (
              <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 mt-2 text-[12px] text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {expanded ? 'Hide reason' : 'Show reason'}
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            {expanded && request.reason && (
              <p className="mt-2 text-[13px] bg-muted/40 rounded-md px-3 py-2">{request.reason}</p>
            )}
          </div>
          {request.status === 'PENDING' && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-[12px]"
                onClick={() => onReview(request, 'approve')}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50 text-[12px]"
                onClick={() => onReview(request, 'reject')}>
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Submitted {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm')}
        </p>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeaveApprovalsPage() {
  const [reviewTarget, setReviewTarget] = useState<{ request: LeaveRequest; action: 'approve' | 'reject' } | null>(null)
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [page, setPage] = useState(0)

  const { data: pending = [], isLoading: pendingLoading } = useManagerPendingRequests()
  const { data: allReqs, isLoading: allLoading } = useManagerAllRequests(page)

  const isLoading = tab === 'pending' ? pendingLoading : allLoading
  const items = tab === 'pending' ? pending : (allReqs?.content ?? [])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-1">Leave Approvals</h1>
          <p className="text-blue-100">Review and action leave requests from your team.</p>
        </div>
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
      </div>

      {/* Pending count chip */}
      {pending.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-600" />
          <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">
            {pending.length} pending request{pending.length !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {(['pending', 'all'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(0) }}
            className={cn('rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all',
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {t === 'pending' ? `Pending (${pending.length})` : 'All Requests'}
          </button>
        ))}
      </div>

      {/* Requests */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-lg mb-1">{tab === 'pending' ? 'All caught up!' : 'No requests yet'}</p>
          <p className="text-[13px] text-muted-foreground">{tab === 'pending' ? 'No pending leave requests from your team.' : 'Your team hasn\'t submitted any leave requests.'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(r => <RequestCard key={r.id} request={r} onReview={(req, act) => setReviewTarget({ request: req, action: act })} />)}
        </div>
      )}

      {/* Pagination for All tab */}
      {tab === 'all' && !allLoading && allReqs && allReqs.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {allReqs.pageNumber + 1} of {allReqs.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={allReqs.first} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={allReqs.last} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Review dialog */}
      {reviewTarget && (
        <ReviewDialog request={reviewTarget.request} action={reviewTarget.action}
          onClose={() => setReviewTarget(null)} />
      )}
    </div>
  )
}
