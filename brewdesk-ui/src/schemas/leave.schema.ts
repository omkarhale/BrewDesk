import { z } from 'zod'

// ── Apply Leave ───────────────────────────────────────────────────────────────

export const applyLeaveSchema = z
  .object({
    leaveTypeId: z.number({ required_error: 'Leave type is required' }).positive('Leave type is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date is required'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date is required'),
    dayDuration: z.enum(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF']).optional(),
    reason: z.string().max(1000, 'Reason must be at most 1000 characters').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date',
      })
    }
  })

export type ApplyLeaveFormValues = z.infer<typeof applyLeaveSchema>

// ── Create / Edit Leave Type ──────────────────────────────────────────────────

export const leaveTypeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase letters, digits or underscores'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  paid: z.boolean({ required_error: 'Required' }),
  genderEligibility: z.enum(['ALL', 'MALE', 'FEMALE', 'OTHER']),
  accrualFrequency: z.enum(['MONTHLY', 'YEARLY', 'NONE']),
  accrualAmount: z.number().min(0, 'Must be ≥ 0'),
  yearlyAllocation: z.number().min(0, 'Must be ≥ 0'),
  halfDayAllowed: z.boolean(),
  carryForwardEnabled: z.boolean(),
  carryForwardLimit: z.number().min(0, 'Must be ≥ 0'),
  documentRequired: z.boolean(),
})

export type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>

// ── Create / Edit Leave Policy ────────────────────────────────────────────────

export const leavePolicySchema = z
  .object({
    leaveTypeId: z.number({ required_error: 'Leave type is required' }).positive(),
    policyName: z.string().min(1, 'Policy name is required').max(150),
    accrualStartRule: z.enum(['JOINING_DATE', 'CALENDAR_YEAR']),
    minimumNoticeDays: z.number().int().min(0),
    maximumConsecutiveDays: z.number().int().min(1, 'Must be at least 1'),
    backdatedAllowed: z.boolean(),
    cancellationAllowed: z.boolean(),
    approvalRequired: z.boolean(),
    effectiveFrom: z.string().optional().nullable(),
    effectiveTo: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.effectiveFrom && data.effectiveTo && data.effectiveFrom > data.effectiveTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveTo'],
        message: 'Effective To must be on or after Effective From',
      })
    }
  })

export type LeavePolicyFormValues = z.infer<typeof leavePolicySchema>

// ── Review (approve / reject) ─────────────────────────────────────────────────

export const reviewLeaveSchema = z.object({
  remarks: z.string().max(500, 'Remarks must be at most 500 characters').optional(),
})

export type ReviewLeaveFormValues = z.infer<typeof reviewLeaveSchema>
