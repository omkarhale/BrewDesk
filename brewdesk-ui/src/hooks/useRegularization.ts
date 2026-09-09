'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  approveRegularization,
  cancelRegularization,
  deleteAttachment,
  getAllRegularizations,
  getMyRegularizations,
  getPendingCount,
  getPendingRegularizations,
  getRegularizationById,
  rejectRegularization,
  submitRegularization,
  uploadAttachment,
  RegularizationAllParams,
  RegularizationListParams,
} from '@/api/attendance'
import { RejectRegularizationRequest, SubmitRegularizationRequest } from '@/types/attendance'

// ── Query keys ────────────────────────────────────────────────────────────────

export const regularizationKeys = {
  all:         ['regularization'] as const,
  my:          (p: RegularizationListParams) => ['regularization', 'my', p] as const,
  detail:      (id: number) => ['regularization', 'detail', id] as const,
  pending:     (p: RegularizationListParams) => ['regularization', 'pending', p] as const,
  pendingCount:() => ['regularization', 'pending', 'count'] as const,
  adminAll:    (p: RegularizationAllParams) => ['regularization', 'admin', p] as const,
}

function apiMsg(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { data?: { message?: string } }; message?: string }
    return e.response?.data?.message || e.message || fallback
  }
  return fallback
}

// ── Employee hooks ────────────────────────────────────────────────────────────

export function useMyRegularizations(params: RegularizationListParams) {
  return useQuery({
    queryKey: regularizationKeys.my(params),
    queryFn:  () => getMyRegularizations(params),
    placeholderData: (prev) => prev,
  })
}

export function useRegularizationDetail(id: number | null) {
  return useQuery({
    queryKey: regularizationKeys.detail(id!),
    queryFn:  () => getRegularizationById(id!),
    enabled:  id !== null,
  })
}

export function useSubmitRegularization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: SubmitRegularizationRequest) => submitRegularization(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: regularizationKeys.all })
      toast.success('Regularization request submitted')
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, 'Failed to submit request')),
  })
}

export function useCancelRegularization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelRegularization(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: regularizationKeys.all })
      toast.success('Request cancelled')
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, 'Failed to cancel request')),
  })
}

// ── Manager hooks ─────────────────────────────────────────────────────────────

export function usePendingRegularizations(params: RegularizationListParams) {
  return useQuery({
    queryKey: regularizationKeys.pending(params),
    queryFn:  () => getPendingRegularizations(params),
    placeholderData: (prev) => prev,
  })
}

export function usePendingCount() {
  return useQuery({
    queryKey: regularizationKeys.pendingCount(),
    queryFn:  getPendingCount,
    refetchInterval: 60_000, // refresh every minute for badge
  })
}

export function useApproveRegularization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approveRegularization(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: regularizationKeys.all })
      toast.success('Request approved — attendance recalculated')
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, 'Failed to approve request')),
  })
}

export function useRejectRegularization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: RejectRegularizationRequest }) =>
      rejectRegularization(id, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: regularizationKeys.all })
      toast.success('Request rejected')
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, 'Failed to reject request')),
  })
}

// ── Attachment hooks ──────────────────────────────────────────────────────────

/** Upload a supporting file to a PENDING regularization request. */
export function useUploadAttachment(requestId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(requestId!, file),
    onSuccess: (_, file) => {
      if (requestId != null) {
        qc.invalidateQueries({ queryKey: regularizationKeys.detail(requestId) })
        qc.invalidateQueries({ queryKey: regularizationKeys.all })
      }
      toast.success(`${file.name} attached`)
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, 'Failed to upload attachment')),
  })
}

/** Delete an attachment from a PENDING regularization request. */
export function useDeleteAttachment(requestId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: number) => deleteAttachment(attachmentId),
    onSuccess: () => {
      if (requestId != null) {
        qc.invalidateQueries({ queryKey: regularizationKeys.detail(requestId) })
        qc.invalidateQueries({ queryKey: regularizationKeys.all })
      }
      toast.success('Attachment removed')
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, 'Failed to remove attachment')),
  })
}

// ── Admin hooks ───────────────────────────────────────────────────────────────

export function useAllRegularizations(params: RegularizationAllParams) {
  return useQuery({
    queryKey: regularizationKeys.adminAll(params),
    queryFn:  () => getAllRegularizations(params),
    placeholderData: (prev) => prev,
  })
}
