import apiClient from '@/lib/api'
import {
    ApplyLeaveRequest, CreateLeavePolicyRequest, CreateLeaveTypeRequest,
    EmployeeLeaveBalance, LeavePageResponse, LeavePolicy,
    LeaveRequest, LeaveType, ReviewLeaveRequest,
} from '@/types/leave'

// ── Employee endpoints ────────────────────────────────────────────────────────

export async function getEligibleLeaveTypes(): Promise<LeaveType[]> {
  const res = await apiClient.get<LeaveType[]>('/api/leave/types')
  return res.data
}

export async function getMyLeaveBalances(): Promise<EmployeeLeaveBalance[]> {
  const res = await apiClient.get<EmployeeLeaveBalance[]>('/api/leave/balances/me')
  return res.data
}

export async function applyLeave(req: ApplyLeaveRequest): Promise<LeaveRequest> {
  const res = await apiClient.post<LeaveRequest>('/api/leave/requests', req)
  return res.data
}

export async function getMyLeaveRequests(page = 0, size = 20): Promise<LeavePageResponse> {
  const res = await apiClient.get<LeavePageResponse>('/api/leave/requests/me', {
    params: { page, size },
  })
  return res.data
}

export async function getMyLeaveRequestById(id: number): Promise<LeaveRequest> {
  const res = await apiClient.get<LeaveRequest>(`/api/leave/requests/me/${id}`)
  return res.data
}

export async function cancelLeaveRequest(id: number): Promise<LeaveRequest> {
  const res = await apiClient.put<LeaveRequest>(`/api/leave/requests/${id}/cancel`)
  return res.data
}

// ── Manager endpoints ─────────────────────────────────────────────────────────

export async function getManagerPendingRequests(): Promise<LeaveRequest[]> {
  const res = await apiClient.get<LeaveRequest[]>('/api/leave/manager/requests/pending')
  return res.data
}

export async function getManagerAllRequests(page = 0, size = 20): Promise<LeavePageResponse> {
  const res = await apiClient.get<LeavePageResponse>('/api/leave/manager/requests', {
    params: { page, size },
  })
  return res.data
}

export async function getManagerRequestDetail(id: number): Promise<LeaveRequest> {
  const res = await apiClient.get<LeaveRequest>(`/api/leave/manager/requests/${id}`)
  return res.data
}

export async function approveLeaveRequest(id: number, review?: ReviewLeaveRequest): Promise<LeaveRequest> {
  const res = await apiClient.put<LeaveRequest>(`/api/leave/manager/requests/${id}/approve`, review ?? {})
  return res.data
}

export async function rejectLeaveRequest(id: number, review?: ReviewLeaveRequest): Promise<LeaveRequest> {
  const res = await apiClient.put<LeaveRequest>(`/api/leave/manager/requests/${id}/reject`, review ?? {})
  return res.data
}

// ── Admin — leave types ───────────────────────────────────────────────────────

export async function adminGetLeaveTypes(): Promise<LeaveType[]> {
  const res = await apiClient.get<LeaveType[]>('/api/admin/leave/types')
  return res.data
}

export async function adminCreateLeaveType(req: CreateLeaveTypeRequest): Promise<LeaveType> {
  const res = await apiClient.post<LeaveType>('/api/admin/leave/types', req)
  return res.data
}

export async function adminUpdateLeaveType(id: number, req: CreateLeaveTypeRequest): Promise<LeaveType> {
  const res = await apiClient.put<LeaveType>(`/api/admin/leave/types/${id}`, req)
  return res.data
}

export async function adminActivateLeaveType(id: number): Promise<LeaveType> {
  const res = await apiClient.put<LeaveType>(`/api/admin/leave/types/${id}/activate`)
  return res.data
}

export async function adminDeactivateLeaveType(id: number): Promise<LeaveType> {
  const res = await apiClient.put<LeaveType>(`/api/admin/leave/types/${id}/deactivate`)
  return res.data
}

// ── Admin — leave policies ────────────────────────────────────────────────────

export async function adminGetLeavePolicies(): Promise<LeavePolicy[]> {
  const res = await apiClient.get<LeavePolicy[]>('/api/admin/leave/policies')
  return res.data
}

export async function adminGetLeavePolicyById(id: number): Promise<LeavePolicy> {
  const res = await apiClient.get<LeavePolicy>(`/api/admin/leave/policies/${id}`)
  return res.data
}

export async function adminCreateLeavePolicy(req: CreateLeavePolicyRequest): Promise<LeavePolicy> {
  const res = await apiClient.post<LeavePolicy>('/api/admin/leave/policies', req)
  return res.data
}

export async function adminUpdateLeavePolicy(id: number, req: CreateLeavePolicyRequest): Promise<LeavePolicy> {
  const res = await apiClient.put<LeavePolicy>(`/api/admin/leave/policies/${id}`, req)
  return res.data
}

export async function adminAssignDepartment(policyId: number, departmentId: number): Promise<LeavePolicy> {
  const res = await apiClient.post<LeavePolicy>(`/api/admin/leave/policies/${policyId}/departments`, { departmentId })
  return res.data
}

export async function adminRemoveDepartment(policyId: number, departmentId: number): Promise<LeavePolicy> {
  const res = await apiClient.delete<LeavePolicy>(`/api/admin/leave/policies/${policyId}/departments/${departmentId}`)
  return res.data
}

export async function adminActivatePolicy(id: number): Promise<LeavePolicy> {
  const res = await apiClient.put<LeavePolicy>(`/api/admin/leave/policies/${id}/activate`)
  return res.data
}

export async function adminDeactivatePolicy(id: number): Promise<LeavePolicy> {
  const res = await apiClient.put<LeavePolicy>(`/api/admin/leave/policies/${id}/deactivate`)
  return res.data
}

// ── Admin — accrual & balance management ─────────────────────────────────────

export async function adminRunAccrual(period: string): Promise<{ status: string; message: string }> {
  const res = await apiClient.post('/api/admin/leave/accrual/run', null, { params: { period } })
  return res.data
}

export async function adminRunAccrualRange(from: string, to: string): Promise<{ status: string; periodsProcessed: number; message: string }> {
  const res = await apiClient.post('/api/admin/leave/accrual/run-range', null, { params: { from, to } })
  return res.data
}

export interface AdjustBalanceRequest {
  employeeId: number
  leaveTypeId: number
  amount: number
  reason?: string
}

export async function adminAdjustBalance(req: AdjustBalanceRequest): Promise<EmployeeLeaveBalance> {
  const res = await apiClient.post<EmployeeLeaveBalance>('/api/admin/leave/accrual/adjust', req)
  return res.data
}

export async function adminGetEmployeeBalances(employeeId: number): Promise<EmployeeLeaveBalance[]> {
  const res = await apiClient.get<EmployeeLeaveBalance[]>(`/api/admin/leave/accrual/balances/${employeeId}`)
  return res.data
}
