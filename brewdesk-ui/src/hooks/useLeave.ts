'use client'

import {
    AdjustBalanceRequest,
    adminActivateLeaveType,
    adminActivatePolicy,
    adminAdjustBalance,
    adminAssignDepartment,
    adminCreateLeavePolicy, adminCreateLeaveType,
    adminDeactivateLeaveType,
    adminDeactivatePolicy,
    adminGetEmployeeBalances,
    adminGetLeavePolicies, adminGetLeaveTypes,
    adminRemoveDepartment,
    adminRunAccrual, adminRunAccrualRange,
    adminUpdateLeavePolicy, adminUpdateLeaveType,
    applyLeave, approveLeaveRequest, cancelLeaveRequest,
    getEligibleLeaveTypes, getManagerAllRequests, getManagerPendingRequests,
    getManagerRequestDetail, getMyLeaveBalances, getMyLeaveRequestById,
    getMyLeaveRequests, rejectLeaveRequest,
} from '@/api/leave'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function apiMsg(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { data?: { message?: string } }; message?: string }
    return e.response?.data?.message || e.message || fallback
  }
  return fallback
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const leaveKeys = {
  eligibleTypes:      ['leave', 'types', 'eligible']        as const,
  myBalances:         ['leave', 'balances', 'me']            as const,
  myRequests:         (p: number) => ['leave', 'requests', 'me', p] as const,
  myRequest:          (id: number) => ['leave', 'requests', 'me', id] as const,
  managerPending:     ['leave', 'manager', 'pending']        as const,
  managerAll:         (p: number) => ['leave', 'manager', 'all', p] as const,
  managerRequest:     (id: number) => ['leave', 'manager', 'requests', id] as const,
  adminTypes:         ['leave', 'admin', 'types']            as const,
  adminPolicies:      ['leave', 'admin', 'policies']         as const,
}

// ── Employee hooks ────────────────────────────────────────────────────────────

export function useEligibleLeaveTypes() {
  return useQuery({ queryKey: leaveKeys.eligibleTypes, queryFn: getEligibleLeaveTypes })
}

export function useMyLeaveBalances() {
  return useQuery({ queryKey: leaveKeys.myBalances, queryFn: getMyLeaveBalances })
}

export function useMyLeaveRequests(page = 0) {
  return useQuery({ queryKey: leaveKeys.myRequests(page), queryFn: () => getMyLeaveRequests(page) })
}

export function useMyLeaveRequestById(id: number) {
  return useQuery({ queryKey: leaveKeys.myRequest(id), queryFn: () => getMyLeaveRequestById(id), enabled: id > 0 })
}

export function useApplyLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: applyLeave,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'requests', 'me'] })
      qc.invalidateQueries({ queryKey: leaveKeys.myBalances })
      toast.success('Leave request submitted successfully')
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to submit leave request')),
  })
}

export function useCancelLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelLeaveRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'requests', 'me'] })
      qc.invalidateQueries({ queryKey: leaveKeys.myBalances })
      toast.success('Leave request cancelled')
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to cancel leave request')),
  })
}

// ── Manager hooks ─────────────────────────────────────────────────────────────

export function useManagerPendingRequests() {
  return useQuery({ queryKey: leaveKeys.managerPending, queryFn: getManagerPendingRequests })
}

export function useManagerAllRequests(page = 0) {
  return useQuery({ queryKey: leaveKeys.managerAll(page), queryFn: () => getManagerAllRequests(page) })
}

export function useManagerRequestDetail(id: number) {
  return useQuery({ queryKey: leaveKeys.managerRequest(id), queryFn: () => getManagerRequestDetail(id), enabled: id > 0 })
}

export function useApproveLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) =>
      approveLeaveRequest(id, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'manager'] })
      toast.success('Leave request approved')
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to approve request')),
  })
}

export function useRejectLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) =>
      rejectLeaveRequest(id, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'manager'] })
      toast.success('Leave request rejected')
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to reject request')),
  })
}

// ── Admin leave type hooks ────────────────────────────────────────────────────

export function useAdminLeaveTypes() {
  return useQuery({ queryKey: leaveKeys.adminTypes, queryFn: adminGetLeaveTypes })
}

export function useAdminCreateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminCreateLeaveType,
    onSuccess: () => { qc.invalidateQueries({ queryKey: leaveKeys.adminTypes }); toast.success('Leave type created') },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to create leave type')),
  })
}

export function useAdminUpdateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: Parameters<typeof adminUpdateLeaveType>[1] }) =>
      adminUpdateLeaveType(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: leaveKeys.adminTypes }); toast.success('Leave type updated') },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to update leave type')),
  })
}

export function useAdminToggleLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? adminActivateLeaveType(id) : adminDeactivateLeaveType(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: leaveKeys.adminTypes })
      toast.success(`Leave type ${vars.active ? 'activated' : 'deactivated'}`)
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to update leave type')),
  })
}

// ── Admin policy hooks ────────────────────────────────────────────────────────

export function useAdminLeavePolicies() {
  return useQuery({ queryKey: leaveKeys.adminPolicies, queryFn: adminGetLeavePolicies })
}

export function useAdminCreateLeavePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminCreateLeavePolicy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: leaveKeys.adminPolicies }); toast.success('Policy created') },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to create policy')),
  })
}

export function useAdminUpdateLeavePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: Parameters<typeof adminUpdateLeavePolicy>[1] }) =>
      adminUpdateLeavePolicy(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: leaveKeys.adminPolicies }); toast.success('Policy updated') },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to update policy')),
  })
}

export function useAdminToggleLeavePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? adminActivatePolicy(id) : adminDeactivatePolicy(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: leaveKeys.adminPolicies })
      toast.success(`Policy ${vars.active ? 'activated' : 'deactivated'}`)
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to update policy')),
  })
}

export function useAdminAssignDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ policyId, departmentId }: { policyId: number; departmentId: number }) =>
      adminAssignDepartment(policyId, departmentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: leaveKeys.adminPolicies }); toast.success('Department assigned') },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to assign department')),
  })
}

export function useAdminRemoveDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ policyId, departmentId }: { policyId: number; departmentId: number }) =>
      adminRemoveDepartment(policyId, departmentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: leaveKeys.adminPolicies }); toast.success('Department removed') },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Failed to remove department')),
  })
}

// ── Admin accrual hooks ───────────────────────────────────────────────────────


export function useAdminRunAccrual() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (period: string) => adminRunAccrual(period),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: leaveKeys.myBalances })
      toast.success(data.message)
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Accrual failed')),
  })
}

export function useAdminRunAccrualRange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => adminRunAccrualRange(from, to),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: leaveKeys.myBalances })
      toast.success(data.message)
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Accrual range failed')),
  })
}

export function useAdminAdjustBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: AdjustBalanceRequest) => adminAdjustBalance(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.myBalances })
      toast.success('Balance adjusted successfully')
    },
    onError: (err: unknown) => toast.error(apiMsg(err, 'Balance adjustment failed')),
  })
}

export function useAdminEmployeeBalances(employeeId: number) {
  return useQuery({
    queryKey: ['leave', 'admin', 'balances', employeeId],
    queryFn: () => adminGetEmployeeBalances(employeeId),
    enabled: employeeId > 0,
  })
}
