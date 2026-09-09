export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "INCOMPLETE"
  | "WEEK_OFF"
  | "HOLIDAY"
  | "ON_LEAVE";

// ── Sessions & Records ────────────────────────────────────────────────────────

export interface AttendanceSession {
  id: number;
  punchIn: string;
  punchOut: string | null;
  workedMinutes: number;
}

export interface AttendanceCalculationResponse {
  id?: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string | null;
  shiftId: number;
  shiftName: string;
  attendanceDate: string;
  firstIn: string | null;
  lastOut: string | null;
  totalWorkMinutes: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  status: AttendanceStatus;
  sessions: AttendanceSession[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecordsParams {
  employeeCode?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus | "";
  page?: number;
  size?: number;
}

export interface AttendanceRecordsPage {
  content: AttendanceCalculationResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ── Raw Events (audit log) ────────────────────────────────────────────────────

export interface AttendanceEvent {
  id: number;
  employeeId: number;
  employeeCode: string;
  eventType: string;
  source: string;
  eventTime: string;
  externalEventId: string | null;
  createdAt: string;
}

export interface AttendanceEventPage {
  content: AttendanceEvent[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ── Bulk Calculation ──────────────────────────────────────────────────────────

export interface BulkCalculationRequest {
  employeeCode?: string;
  dateFrom: string;
  dateTo: string;
}

export interface BulkCalculationResponse {
  totalDays: number;
  totalEmployees: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}

// ── Department ────────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
}

export interface UpdateDepartmentRequest {
  name: string;
  code: string;
  active?: boolean;
}

// ── Shift ─────────────────────────────────────────────────────────────────────

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  minimumWorkMinutes: number;
  halfDayMinutes: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  minimumWorkMinutes: number;
  halfDayMinutes: number;
}

export interface UpdateShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  minimumWorkMinutes: number;
  halfDayMinutes: number;
  active?: boolean;
}

// ── Employee ──────────────────────────────────────────────────────────────────

export interface Employee {
  id: number;
  userId: number;
  userName: string | null;
  employeeCode: string;
  departmentId: number | null;
  departmentName: string | null;
  shiftId: number | null;
  shiftName: string | null;
  designation: string | null;
  managerId: number | null;
  joiningDate: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  userId: number;
  employeeCode: string;
  departmentId?: number | null;
  shiftId?: number | null;
  designation?: string;
  managerId?: number | null;
  joiningDate: string;
}

export interface UpdateEmployeeRequest {
  departmentId?: number | null;
  shiftId?: number | null;
  designation?: string;
  managerId?: number | null;
  joiningDate: string;
  active?: boolean;
}

// ── Simulate Punch ────────────────────────────────────────────────────────────

export interface SimulatePunchRequest {
  employeeCode: string;
  eventTime: string;
  source: "FACE" | "FINGERPRINT" | "RFID_CARD" | "WEB" | "MOBILE" | "ADMIN" | "API";
  eventType: "PUNCH";
  externalEventId: string;
}

// ── Regularization ────────────────────────────────────────────────────────────

export type RegularizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type RegularizationType =
  | 'MISSED_PUNCH'
  | 'INCORRECT_PUNCH'
  | 'LATE_ARRIVAL'
  | 'EARLY_EXIT'
  | 'HALF_DAY'
  | 'FULL_DAY'
export type HalfDayType = 'FIRST_HALF' | 'SECOND_HALF'

export interface SubmitRegularizationRequest {
  attendanceDate: string          // ISO date YYYY-MM-DD
  type: RegularizationType
  requestedPunchIn?: string | null   // ISO datetime
  requestedPunchOut?: string | null  // ISO datetime
  halfDayType?: HalfDayType | null
  reason: string
}

export interface RejectRegularizationRequest {
  rejectionReason: string
}

export interface RegularizationAttachmentResponse {
  id: number
  originalFilename: string
  contentType: string
  fileSizeBytes: number
  uploadedById: number
  uploadedByName: string | null
  uploadedAt: string
}

export interface RegularizationRequestResponse {
  id: number
  employeeId: number
  employeeCode: string
  employeeName: string | null
  managerId: number | null
  managerName: string | null
  attendanceDate: string
  type: RegularizationType
  requestedPunchIn: string | null
  requestedPunchOut: string | null
  halfDayType: HalfDayType | null
  reason: string
  currentAttendance: AttendanceCalculationResponse | null
  status: RegularizationStatus
  reviewedById: number | null
  reviewedByName: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  attachments: RegularizationAttachmentResponse[]
  submittedAt: string
  createdAt: string
  updatedAt: string
}

export interface RegularizationRequestSummaryResponse {
  id: number
  employeeId: number
  employeeCode: string
  employeeName: string | null
  attendanceDate: string
  type: RegularizationType
  requestedPunchIn: string | null
  requestedPunchOut: string | null
  currentAttendanceStatus: string | null
  status: RegularizationStatus
  reviewedByName: string | null
  reviewedAt: string | null
  hasAttachments: boolean
  submittedAt: string
}

export interface RegularizationRequestPage {
  content: RegularizationRequestSummaryResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// ── Web Punch ─────────────────────────────────────────────────────────────────

export interface WebPunchResponse {
  eventId: number;
  employeeCode: string;
  eventTime: string;
  source: string;
  eventType: string;
  message: string;
}
