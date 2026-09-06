export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'INCOMPLETE'
  | 'WEEK_OFF'
  | 'HOLIDAY'
  | 'ON_LEAVE'

export interface AttendanceSession {
  id: number
  punchIn: string
  punchOut: string | null
  workedMinutes: number
}

export interface AttendanceCalculationResponse {
  employeeId: number
  employeeCode: string
  shiftId: number
  shiftName: string
  attendanceDate: string
  firstIn: string | null
  lastOut: string | null
  totalWorkMinutes: number
  lateMinutes: number
  earlyExitMinutes: number
  status: AttendanceStatus
  sessions: AttendanceSession[]
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: number
  name: string
  code: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: number
  userId: number
  employeeCode: string
  departmentId: number | null
  departmentName: string | null
  shiftId: number | null
  shiftName: string | null
  designation: string | null
  managerId: number | null
  joiningDate: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Shift {
  id: number
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  graceMinutes: number
  minimumWorkMinutes: number
  halfDayMinutes: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateDepartmentRequest {
  name: string
  code: string
}

export interface CreateEmployeeRequest {
  userId: number
  employeeCode: string
  departmentId?: number
  shiftId: number
  designation?: string
  managerId?: number
  joiningDate: string
}

export interface CreateShiftRequest {
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  graceMinutes: number
  minimumWorkMinutes: number
  halfDayMinutes: number
  active?: boolean
}

export interface SimulatePunchRequest {
  employeeCode: string
  eventTime: string
  source: 'FACE' | 'FINGERPRINT' | 'RFID_CARD' | 'WEB' | 'MOBILE' | 'ADMIN' | 'API'
  eventType: 'PUNCH'
  externalEventId: string
}

// ── Attendance Records list ───────────────────────────────────────────────────

export interface AttendanceRecordsParams {
  employeeCode?: string
  dateFrom?: string
  dateTo?: string
  status?: AttendanceStatus | ''
  page?: number
  size?: number
}

export interface AttendanceRecordsPage {
  content: AttendanceCalculationResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// ── Web punch ─────────────────────────────────────────────────────────────────

export interface WebPunchResponse {
  eventId: number
  employeeCode: string
  eventTime: string
  source: string
  eventType: string
  message: string
}
