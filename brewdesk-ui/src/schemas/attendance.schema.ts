import { z } from 'zod'

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name must not exceed 100 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Department code is required')
    .max(20, 'Department code must not exceed 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Code may only contain letters, numbers, hyphens, and underscores',
    ),
})

export type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>

// ── Shift schema ─────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createShiftSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Shift name must be at least 2 characters')
      .max(100, 'Shift name must not exceed 100 characters'),
    startTime: z
      .string()
      .min(1, 'Start time is required')
      .regex(timeRegex, 'Start time must be in HH:MM format'),
    endTime: z
      .string()
      .min(1, 'End time is required')
      .regex(timeRegex, 'End time must be in HH:MM format'),
    breakMinutes: z
      .number({ invalid_type_error: 'Break minutes must be a number' })
      .int('Must be a whole number')
      .min(0, 'Break minutes cannot be negative')
      .max(480, 'Break minutes cannot exceed 480'),
    graceMinutes: z
      .number({ invalid_type_error: 'Grace minutes must be a number' })
      .int('Must be a whole number')
      .min(0, 'Grace minutes cannot be negative')
      .max(120, 'Grace minutes cannot exceed 120'),
    minimumWorkMinutes: z
      .number({ invalid_type_error: 'Minimum work minutes must be a number' })
      .int('Must be a whole number')
      .min(0, 'Minimum work minutes cannot be negative')
      .max(1440, 'Minimum work minutes cannot exceed 1440'),
    halfDayMinutes: z
      .number({ invalid_type_error: 'Half day minutes must be a number' })
      .int('Must be a whole number')
      .min(0, 'Half day minutes cannot be negative')
      .max(720, 'Half day minutes cannot exceed 720'),
  })
  .refine(
    (data) => data.halfDayMinutes <= data.minimumWorkMinutes || data.minimumWorkMinutes === 0,
    {
      message: 'Half day minutes cannot exceed minimum work minutes',
      path: ['halfDayMinutes'],
    },
  )

export type CreateShiftFormValues = z.infer<typeof createShiftSchema>

// ── Employee schema ───────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  userId: z
    .number({ required_error: 'User is required', invalid_type_error: 'User is required' })
    .int()
    .positive('User is required'),
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required')
    .max(50, 'Employee code must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Employee code may only contain letters, numbers, hyphens, and underscores',
    ),
  departmentId: z
    .number({ invalid_type_error: 'Department is required' })
    .int()
    .positive('Department is required')
    .optional()
    .nullable(),
  shiftId: z
    .number({ required_error: 'Shift is required', invalid_type_error: 'Shift is required' })
    .int()
    .positive('Shift is required'),
  designation: z
    .string()
    .trim()
    .max(100, 'Designation must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  managerId: z
    .number({ invalid_type_error: 'Manager must be a valid user' })
    .int()
    .positive()
    .optional()
    .nullable(),
  joiningDate: z
    .string()
    .min(1, 'Joining date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be in YYYY-MM-DD format'),
})

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>

// ── Punch Simulator schema ────────────────────────────────────────────────────

export const simulatePunchSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required')
    .max(50, 'Employee code must not exceed 50 characters'),
  eventDate: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eventTime: z
    .string()
    .min(1, 'Time is required')
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
  source: z.enum(
    ['FACE', 'FINGERPRINT', 'RFID_CARD', 'WEB', 'MOBILE', 'ADMIN', 'API'],
    { required_error: 'Source is required' },
  ),
  eventType: z.literal('PUNCH'),
  externalEventId: z
    .string()
    .trim()
    .min(1, 'External event ID is required')
    .max(100, 'External event ID must not exceed 100 characters'),
})

export type SimulatePunchFormValues = z.infer<typeof simulatePunchSchema>
