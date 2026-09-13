// ── Enums ─────────────────────────────────────────────────────────────────────

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type GenderEligibility = 'ALL' | 'MALE' | 'FEMALE' | 'OTHER'
export type AccrualFrequency = 'MONTHLY' | 'YEARLY' | 'NONE'
export type DayDuration = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF'
export type AccrualStartRule = 'JOINING_DATE' | 'CALENDAR_YEAR'

// ── Leave Type ────────────────────────────────────────────────────────────────

export interface LeaveType {
  id: number
  code: string
  name: string
  description: string | null
  paid: boolean
  genderEligibility: GenderEligibility
  accrualFrequency: AccrualFrequency
  accrualAmount: number
  yearlyAllocation: number
  halfDayAllowed: boolean
  carryForwardEnabled: boolean
  carryForwardLimit: number
  documentRequired: boolean
  active: boolean
}

// ── Leave Policy ──────────────────────────────────────────────────────────────

export interface DepartmentAssignment {
  id: number
  departmentId: number
  departmentName: string
  departmentCode: string
}

export interface LeavePolicy {
  id: number
  leaveTypeId: number
  leaveTypeName: string
  leaveTypeCode: string
  policyName: string
  accrualStartRule: AccrualStartRule
  minimumNoticeDays: number
  maximumConsecutiveDays: number
  backdatedAllowed: boolean
  cancellationAllowed: boolean
  approvalRequired: boolean
  effectiveFrom: string | null
  effectiveTo: string | null
  active: boolean
  departments: DepartmentAssignment[]
}

// ── Employee Balance ───────────────────────────────────────────────────────────

export interface EmployeeLeaveBalance {
  id: number
  leaveTypeId: number
  leaveTypeCode: string
  leaveTypeName: string
  paid: boolean
  openingBalance: number
  accrued: number
  used: number
  pending: number
  adjusted: number
  available: number
}

// ── Leave Request ─────────────────────────────────────────────────────────────

export interface LeaveApprovalHistory {
  id: number
  action: string
  performedBy: string | null
  remarks: string | null
  createdAt: string
}

export interface LeaveRequest {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: string
  leaveTypeId: number
  leaveTypeName: string
  leaveTypeCode: string
  startDate: string
  endDate: string
  totalDays: number
  status: LeaveStatus
  dayDuration: DayDuration | null
  reason: string | null
  remarks: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  createdAt: string
  history: LeaveApprovalHistory[]
}

export interface LeavePageResponse {
  content: LeaveRequest[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// ── Request Shapes ────────────────────────────────────────────────────────────

export interface ApplyLeaveRequest {
  leaveTypeId: number
  startDate: string        // YYYY-MM-DD
  endDate: string          // YYYY-MM-DD
  dayDuration?: DayDuration
  reason?: string
}

export interface CreateLeaveTypeRequest {
  code: string
  name: string
  description?: string
  paid: boolean
  genderEligibility: GenderEligibility
  accrualFrequency: AccrualFrequency
  accrualAmount: number
  yearlyAllocation: number
  halfDayAllowed: boolean
  carryForwardEnabled: boolean
  carryForwardLimit: number
  documentRequired: boolean
}

export interface CreateLeavePolicyRequest {
  leaveTypeId: number
  policyName: string
  accrualStartRule: AccrualStartRule
  minimumNoticeDays: number
  maximumConsecutiveDays: number
  backdatedAllowed: boolean
  cancellationAllowed: boolean
  approvalRequired: boolean
  effectiveFrom?: string | null
  effectiveTo?: string | null
  departmentIds?: number[]
}

export interface ReviewLeaveRequest {
  remarks?: string
}

// ── Status helpers ────────────────────────────────────────────────────────────

export const LEAVE_STATUS_CONFIG: Record<LeaveStatus, { label: string; pill: string }> = {
  PENDING:   { label: 'Pending',   pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  APPROVED:  { label: 'Approved',  pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  REJECTED:  { label: 'Rejected',  pill: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  CANCELLED: { label: 'Cancelled', pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}
