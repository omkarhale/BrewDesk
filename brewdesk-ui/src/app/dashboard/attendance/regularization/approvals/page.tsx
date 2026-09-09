'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileText, Loader2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceComparisonPanel } from '@/features/attendance/components/regularization/AttendanceComparisonPanel'
import { RegularizationStatusBadge } from '@/features/attendance/components/regularization/RegularizationStatusBadge'
import { getRegularizationTypeLabel } from '@/features/attendance/components/regularization/RegularizationTypeBadge'
import {
  useApproveRegularization,
  usePendingCount,
  usePendingRegularizations,
  useRegularizationDetail,
  useRejectRegularization,
} from '@/hooks/useRegularization'
import { useAuth } from '@/hooks/useAuth'
import { isManagement } from '@/types/auth'
import { RegularizationRequestSummaryResponse } from '@/types/attendance'
import { cn, formatAttendanceDate } from '@/lib/utils'
import { Label } from '@/components/ui/label'

// ── Reject form ───────────────────────────────────────────────────────────────

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(1000),
})
type RejectForm = z.infer<typeof rejectSchema>

function RejectDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const reject = useRejectRegularization()
  const { register, handleSubmit, formState: { errors } } = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
  })

  const onSubmit = async (values: RejectForm) => {
    await reject.mutateAsync({ id, request: { rejectionReason: values.rejectionReason } })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card-flat w-full max-w-md mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-foreground">Reject Request</h3>
          <button type="button" onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rej-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="rej-reason"
              rows={3}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Explain why this request is being rejected…"
              {...register('rejectionReason')}
            />
            {errors.rejectionReason && (
              <p className="text-xs text-destructive">{errors.rejectionReason.message}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="text-[13px] h-8">Cancel</Button>
            <Button type="submit" variant="destructive" disabled={reject.isPending} className="text-[13px] h-8 gap-1.5">
              {reject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : null}
              Reject
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function ApprovalDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useRegularizationDetail(id)
  const approve = useApproveRegularization()
  const [showReject, setShowReject] = useState(false)

  if (isLoading) return (
    <div className="card-flat p-5 space-y-3">
      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
    </div>
  )
  if (!data) return null

  return (
    <>
      <div className="card-flat overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}>
                {data.employeeName ?? data.employeeCode}
              </span>
              <span className="font-mono text-[12px] text-muted-foreground">{data.employeeCode}</span>
              <RegularizationStatusBadge status={data.status} />
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              {getRegularizationTypeLabel(data.type)} · {formatAttendanceDate(data.attendanceDate)}
              {data.submittedAt && ` · Submitted ${format(new Date(data.submittedAt), 'dd MMM yyyy, HH:mm')}`}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="card-flat p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
            <p className="text-[13px]">{data.reason}</p>
          </div>

          <AttendanceComparisonPanel request={data} />

          {data.attachments.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Attachments ({data.attachments.length})
              </p>
              <div className="space-y-1.5">
                {data.attachments.map(a => (
                  <a key={a.id}
                    href={`/api/attendance/regularization/attachments/${a.id}/download`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] hover:bg-muted transition-colors">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{a.originalFilename}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {(a.fileSizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {data.status === 'PENDING' && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="gap-1.5 text-[13px] h-8"
                disabled={approve.isPending}
                onClick={() => approve.mutate(data.id)}>
                {approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check className="h-3.5 w-3.5"/>}
                Approve
              </Button>
              <Button size="sm" variant="outline"
                className="text-destructive border-destructive/30 hover:bg-red-50 text-[13px] h-8"
                onClick={() => setShowReject(true)}>
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {showReject && (
        <RejectDialog id={data.id} onClose={() => { setShowReject(false); onClose() }} />
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const { user } = useAuth()
  const canApprove = isManagement(user?.role) || user?.role === 'REPORTING_MANAGER'
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data: countData } = usePendingCount()
  const { data, isLoading } = usePendingRegularizations({ page, size: 20 })

  if (!canApprove) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <Users className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
      <p className="text-sm text-muted-foreground">Only managers and admins can approve requests.</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Regularization Approvals
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Review and action pending requests from your team.
          </p>
        </div>
        {countData !== undefined && countData > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-[12px] font-semibold px-3 py-1">
            {countData} pending
          </span>
        )}
      </div>

      {selectedId !== null && (
        <ApprovalDetail id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header-rippling">
                {['Employee','Date','Type','Current Status','Submitted','Attach.'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><Skeleton className="h-3.5 w-20"/></td>)}
                    </tr>
                  ))
                : !data?.content?.length
                ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                    No pending requests in your team.
                  </td></tr>
                : data.content.map(r => (
                    <tr key={r.id}
                      className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedId(r.id)}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium">{r.employeeName ?? '—'}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{r.employeeCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px]">{formatAttendanceDate(r.attendanceDate)}</td>
                      <td className="px-4 py-3 text-[13px]">{getRegularizationTypeLabel(r.type)}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{r.currentAttendanceStatus ?? '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">
                        {r.submittedAt ? format(new Date(r.submittedAt), 'dd MMM, HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.hasAttachments && <FileText className="h-3.5 w-3.5 text-muted-foreground"/>}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[12px] text-muted-foreground">
            Page {data.pageNumber + 1} of {data.totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={data.first} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4"/>Prev
            </Button>
            <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>
              Next<ChevronRight className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
