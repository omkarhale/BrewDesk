'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceComparisonPanel } from '@/features/attendance/components/regularization/AttendanceComparisonPanel'
import { RegularizationStatusBadge } from '@/features/attendance/components/regularization/RegularizationStatusBadge'
import { getRegularizationTypeLabel } from '@/features/attendance/components/regularization/RegularizationTypeBadge'
import { AttachmentDropzone } from '@/features/attendance/components/regularization/AttachmentDropzone'
import {
  useCancelRegularization,
  useMyRegularizations,
  useRegularizationDetail,
  useSubmitRegularization,
} from '@/hooks/useRegularization'
import { useMyProfile } from '@/hooks/useWebPunch'
import { calculateAttendance } from '@/api/attendance'
import {
  HalfDayType,
  RegularizationStatus,
  RegularizationType,
  RegularizationRequestSummaryResponse,
} from '@/types/attendance'
import {
  submitRegularizationSchema,
  SubmitRegularizationFormValues,
} from '@/schemas/attendance.schema'
import { cn, formatAttendanceDate } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: RegularizationType; label: string }[] = [
  { value: 'MISSED_PUNCH',    label: 'Missed Punch' },
  { value: 'INCORRECT_PUNCH', label: 'Incorrect Punch' },
  { value: 'LATE_ARRIVAL',    label: 'Late Arrival' },
  { value: 'EARLY_EXIT',      label: 'Early Exit' },
  { value: 'HALF_DAY',        label: 'Half Day' },
  { value: 'FULL_DAY',        label: 'Full Day' },
]

type MissedPunchSelector = 'IN' | 'OUT' | 'BOTH'

function punchTimesForMissed(sel: MissedPunchSelector) {
  return {
    showIn:  sel === 'IN'  || sel === 'BOTH',
    showOut: sel === 'OUT' || sel === 'BOTH',
  }
}

/**
 * Per-type visibility for requested punch times. MISSED_PUNCH is driven by
 * its separate "which punch is missing?" selector instead of a static rule.
 */
function punchTimeVisibility(
  t: RegularizationType,
  missed: MissedPunchSelector | null,
): { showIn: boolean; showOut: boolean } {
  if (t === 'MISSED_PUNCH') {
    return punchTimesForMissed(missed ?? 'BOTH')
  }
  const map: Record<Exclude<RegularizationType, 'MISSED_PUNCH'>, [boolean, boolean]> = {
    INCORRECT_PUNCH: [true, true],
    LATE_ARRIVAL:    [true, false],
    EARLY_EXIT:      [false, true],
    HALF_DAY:        [false, false],
    FULL_DAY:        [true, true],
  }
  const [showIn, showOut] = map[t as Exclude<RegularizationType, 'MISSED_PUNCH'>]
  return { showIn, showOut }
}

// ── New Request Form ──────────────────────────────────────────────────────────

function NewRequestForm({
  onDone,
  onSubmitted,
}: {
  onDone: () => void
  onSubmitted: (requestId: number) => void
}) {
  const submit = useSubmitRegularization()
  const { data: profile } = useMyProfile()
  const [previewAttendance, setPreviewAttendance] =
    useState<import('@/types/attendance').AttendanceCalculationResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [missedPunch, setMissedPunch] = useState<MissedPunchSelector>('BOTH')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubmitRegularizationFormValues>({
    resolver: zodResolver(submitRegularizationSchema),
    defaultValues: {
      attendanceDate: '',
      type: 'MISSED_PUNCH',
      reason: '',
    },
  })

  const [type, date] = [watch('type'), watch('attendanceDate')]
  const { showIn, showOut } = punchTimeVisibility(type, missedPunch)

  const loadPreview = async () => {
    if (!profile?.employeeCode || !date) return
    setLoadingPreview(true)
    try {
      const r = await calculateAttendance(profile.employeeCode, date)
      setPreviewAttendance(r)
    } catch {
      setPreviewAttendance(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  const onSubmit = async (values: SubmitRegularizationFormValues) => {
    // For MISSED_PUNCH with a specific selector, drop the non-selected time
    // so the backend doesn't receive a stray value from a previous selection.
    let punchIn  = values.requestedPunchIn
    let punchOut = values.requestedPunchOut
    if (values.type === 'MISSED_PUNCH') {
      const { showIn, showOut } = punchTimeVisibility(values.type, missedPunch)
      if (!showIn)  punchIn  = null
      if (!showOut) punchOut = null
    }

    const isoIn  = punchIn  && type !== 'HALF_DAY' ? `${values.attendanceDate}T${punchIn}:00`  : null
    const isoOut = punchOut && type !== 'HALF_DAY' ? `${values.attendanceDate}T${punchOut}:00` : null

    const result = await submit.mutateAsync({
      attendanceDate:    values.attendanceDate,
      type:              values.type,
      requestedPunchIn:  isoIn,
      requestedPunchOut: isoOut,
      halfDayType:       values.halfDayType ?? null,
      reason:            values.reason,
    })
    onSubmitted(result.id)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Date + type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rg-date">Attendance Date</Label>
          <div className="flex gap-2">
            <Input
              id="rg-date"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('attendanceDate')}
              className="text-[13px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadPreview}
              disabled={!date || loadingPreview}
            >
              {loadingPreview ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Preview'
              )}
            </Button>
          </div>
          {errors.attendanceDate && (
            <p className="text-xs text-destructive">
              {errors.attendanceDate.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setValue('type', v as RegularizationType, { shouldValidate: true })
              setValue('requestedPunchIn', null, { shouldValidate: true })
              setValue('requestedPunchOut', null, { shouldValidate: true })
              setValue('halfDayType', null, { shouldValidate: true })
            }}
          >
            <SelectTrigger className="text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current attendance preview */}
      {previewAttendance && (
        <div className="card-flat p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current Attendance
          </p>
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{previewAttendance.status}</span>
            <span className="text-muted-foreground">First In</span>
            <span className="font-mono">
              {previewAttendance.firstIn
                ? format(new Date(previewAttendance.firstIn), 'HH:mm')
                : '—'}
            </span>
            <span className="text-muted-foreground">Last Out</span>
            <span className="font-mono">
              {previewAttendance.lastOut
                ? format(new Date(previewAttendance.lastOut), 'HH:mm')
                : '—'}
            </span>
          </div>
        </div>
      )}

      {/* MISSED_PUNCH: which punch? */}
      {type === 'MISSED_PUNCH' && (
        <div className="space-y-1.5">
          <Label>Which punch is missing?</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { v: 'IN',   label: 'Punch In' },
                { v: 'OUT',  label: 'Punch Out' },
                { v: 'BOTH', label: 'Both Punches' },
              ] as { v: MissedPunchSelector; label: string }[]
            ).map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setMissedPunch(v)}
                className={cn(
                  'h-8 rounded-md border px-3 text-[13px] transition-colors',
                  missedPunch === v
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-600'
                    : 'border-border bg-card hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic time fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        {showIn && (
          <div className="space-y-1.5">
            <Label htmlFor="rg-in">Requested Punch In</Label>
            <Input
              id="rg-in"
              type="time"
              {...register('requestedPunchIn')}
              className="text-[13px]"
            />
            {errors.requestedPunchIn && (
              <p className="text-xs text-destructive">
                {errors.requestedPunchIn.message as string}
              </p>
            )}
          </div>
        )}
        {showOut && (
          <div className="space-y-1.5">
            <Label htmlFor="rg-out">Requested Punch Out</Label>
            <Input
              id="rg-out"
              type="time"
              {...register('requestedPunchOut')}
              className="text-[13px]"
            />
            {errors.requestedPunchOut && (
              <p className="text-xs text-destructive">
                {errors.requestedPunchOut.message as string}
              </p>
            )}
          </div>
        )}
        {type === 'HALF_DAY' && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Half Day</Label>
            <Select
              value={watch('halfDayType') ?? ''}
              onValueChange={(v) =>
                setValue('halfDayType', v as HalfDayType, { shouldValidate: true })
              }
            >
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select half" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST_HALF">First Half</SelectItem>
                <SelectItem value="SECOND_HALF">Second Half</SelectItem>
              </SelectContent>
            </Select>
            {errors.halfDayType && (
              <p className="text-xs text-destructive">
                {errors.halfDayType.message as string}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <Label htmlFor="rg-reason">
          Reason <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="rg-reason"
          rows={3}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Explain why correction is needed (min 10 characters)"
          {...register('reason')}
        />
        {errors.reason && (
          <p className="text-xs text-destructive">{errors.reason.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-muted-foreground">
          Attachments can be added after submission from the request detail.
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            className="h-8 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submit.isPending}
            className="h-8 gap-1.5 text-[13px]"
          >
            {submit.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

// ── Request row ───────────────────────────────────────────────────────────────

function RequestRow({
  req,
  onSelect,
}: {
  req: RegularizationRequestSummaryResponse
  onSelect: () => void
}) {
  return (
    <tr
      className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <td className="px-4 py-3 text-[13px]">
        {formatAttendanceDate(req.attendanceDate)}
      </td>
      <td className="px-4 py-3 text-[13px]">
        {getRegularizationTypeLabel(req.type)}
      </td>
      <td className="hidden px-4 py-3 text-[12px] text-muted-foreground sm:table-cell">
        {req.currentAttendanceStatus ?? '—'}
      </td>
      <td className="px-4 py-3">
        <RegularizationStatusBadge status={req.status} />
      </td>
      <td className="hidden px-4 py-3 text-[12px] text-muted-foreground md:table-cell">
        {req.submittedAt
          ? format(new Date(req.submittedAt), 'dd MMM yyyy')
          : '—'}
      </td>
      <td className="px-4 py-3">
        {req.hasAttachments && (
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </td>
    </tr>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  id,
  onClose,
}: {
  id: number
  onClose: () => void
}) {
  const { data, isLoading } = useRegularizationDetail(id)
  const cancel = useCancelRegularization()

  if (isLoading) {
    return (
      <div className="card-flat p-5 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="card-flat overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p
            className="text-[14px] font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {getRegularizationTypeLabel(data.type)} —{' '}
            {formatAttendanceDate(data.attendanceDate)}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {data.reason}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RegularizationStatusBadge status={data.status} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <AttendanceComparisonPanel request={data} />

        {data.status === 'REJECTED' && data.rejectionReason && (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 dark:border-red-900/30 dark:bg-red-900/10">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                Rejection reason
              </p>
              <p className="mt-0.5 text-[12px] text-red-600 dark:text-red-400">
                {data.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Attachments — editable when PENDING, read-only otherwise */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Supporting attachments
            {data.status === 'PENDING' && (
              <span className="ml-2 font-normal text-foreground/70 normal-case tracking-normal">
                Add PDF / JPEG / PNG evidence (max 5 MB)
              </span>
            )}
          </p>
          <AttachmentDropzone
            requestId={data.id}
            attachments={data.attachments}
            readOnly={data.status !== 'PENDING'}
          />
        </div>

        {data.status === 'PENDING' && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-destructive/30 text-[13px] text-destructive hover:bg-red-50"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(data.id)}
          >
            {cancel.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyRegularizationPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<RegularizationStatus | ''>('')

  const { data, isLoading, refetch } = useMyRegularizations({
    status: statusFilter || undefined,
    page,
    size: 20,
  })

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-[22px] font-semibold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            My Regularizations
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Request corrections for missed or incorrect attendance records.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true)
            setSelectedId(null)
          }}
          className="h-8 gap-1.5 text-[13px]"
        >
          <Plus className="h-3.5 w-3.5" /> New Request
        </Button>
      </div>

      {showForm && (
        <div className="card-flat overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3
              className="text-[14px] font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              New Regularization Request
            </h3>
          </div>
          <div className="p-5">
            <NewRequestForm
              onDone={() => setShowForm(false)}
              onSubmitted={(newId) => {
                setShowForm(false)
                setSelectedId(newId)
                refetch()
              }}
            />
          </div>
        </div>
      )}

      {selectedId !== null && (
        <DetailPanel id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter || '__all'}
          onValueChange={(v) => {
            setStatusFilter(v === '__all' ? '' : (v as RegularizationStatus))
            setPage(0)
          }}
        >
          <SelectTrigger className="h-8 w-40 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {!isLoading && data && (
          <span className="text-[12px] text-muted-foreground">
            {data.totalElements} request{data.totalElements !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header-rippling">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Current
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Submitted
                </th>
                <th className="w-8 px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Skeleton className="h-3.5 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-3.5 w-32" />
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <Skeleton className="h-3.5 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Skeleton className="h-3.5 w-24" />
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                : !data?.content?.length
                  ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-[13px] text-muted-foreground"
                        >
                          No regularization requests yet.{' '}
                          <button
                            type="button"
                            className="text-teal-600 underline"
                            onClick={() => setShowForm(true)}
                          >
                            Submit your first request.
                          </button>
                        </td>
                      </tr>
                    )
                  : data.content.map((r) => (
                      <RequestRow
                        key={r.id}
                        req={r}
                        onSelect={() => setSelectedId(r.id)}
                      />
                    ))}
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
            <Button
              variant="outline"
              size="sm"
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
