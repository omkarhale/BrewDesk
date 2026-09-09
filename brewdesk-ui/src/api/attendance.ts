import apiClient from "@/lib/api";
import {
  AttendanceCalculationResponse,
  AttendanceEventPage,
  AttendanceRecordsPage,
  AttendanceRecordsParams,
  BulkCalculationRequest,
  BulkCalculationResponse,
  CreateDepartmentRequest,
  CreateEmployeeRequest,
  CreateShiftRequest,
  Department,
  Employee,
  RegularizationAttachmentResponse,
  RegularizationRequestPage,
  RegularizationRequestResponse,
  RegularizationStatus,
  RegularizationType,
  RejectRegularizationRequest,
  Shift,
  SimulatePunchRequest,
  SubmitRegularizationRequest,
  UpdateDepartmentRequest,
  UpdateEmployeeRequest,
  UpdateShiftRequest,
  WebPunchResponse,
} from "@/types/attendance";

// ── Attendance Calculation ────────────────────────────────────────────────────

export async function calculateAttendance(
  employeeCode: string,
  attendanceDate: string
): Promise<AttendanceCalculationResponse> {
  const res = await apiClient.post<AttendanceCalculationResponse>(
    `/api/attendance/calculation?employeeCode=${encodeURIComponent(employeeCode)}&attendanceDate=${encodeURIComponent(attendanceDate)}`
  );
  return res.data;
}

export async function bulkCalculateAttendance(
  request: BulkCalculationRequest
): Promise<BulkCalculationResponse> {
  const res = await apiClient.post<BulkCalculationResponse>(
    "/api/attendance/calculation/bulk",
    request
  );
  return res.data;
}

// ── Attendance Records ────────────────────────────────────────────────────────

export async function getAttendanceRecords(
  params: AttendanceRecordsParams
): Promise<AttendanceRecordsPage> {
  const query = new URLSearchParams();
  if (params.employeeCode) query.set("employeeCode", params.employeeCode);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 20));
  const res = await apiClient.get<AttendanceRecordsPage>(
    `/api/attendance/records?${query.toString()}`
  );
  return res.data;
}

export async function getMonthAttendance(
  employeeCode: string,
  year: number,
  month: number
): Promise<AttendanceCalculationResponse[]> {
  const res = await apiClient.get<AttendanceCalculationResponse[]>(
    `/api/attendance/records/month?employeeCode=${encodeURIComponent(employeeCode)}&year=${year}&month=${month}`
  );
  return res.data;
}

// ── Raw Event Audit Log ───────────────────────────────────────────────────────

export interface AttendanceEventsParams {
  employeeCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export async function getAttendanceEvents(
  params: AttendanceEventsParams
): Promise<AttendanceEventPage> {
  const query = new URLSearchParams();
  if (params.employeeCode) query.set("employeeCode", params.employeeCode);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 50));
  const res = await apiClient.get<AttendanceEventPage>(
    `/api/attendance/events?${query.toString()}`
  );
  return res.data;
}

// ── Departments ───────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  const res = await apiClient.get<Department[]>("/api/attendance/departments");
  return res.data;
}

export async function createDepartment(
  request: CreateDepartmentRequest
): Promise<Department> {
  const res = await apiClient.post<Department>(
    "/api/attendance/departments",
    request
  );
  return res.data;
}

export async function updateDepartment(
  id: number,
  request: UpdateDepartmentRequest
): Promise<Department> {
  const res = await apiClient.put<Department>(
    `/api/attendance/departments/${id}`,
    request
  );
  return res.data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/api/attendance/departments/${id}`);
}

// ── Shifts ────────────────────────────────────────────────────────────────────

export async function getShifts(): Promise<Shift[]> {
  const res = await apiClient.get<Shift[]>("/api/attendance/shifts");
  return res.data;
}

export async function createShift(request: CreateShiftRequest): Promise<Shift> {
  const res = await apiClient.post<Shift>("/api/attendance/shifts", request);
  return res.data;
}

export async function updateShift(
  id: number,
  request: UpdateShiftRequest
): Promise<Shift> {
  const res = await apiClient.put<Shift>(
    `/api/attendance/shifts/${id}`,
    request
  );
  return res.data;
}

export async function deleteShift(id: number): Promise<void> {
  await apiClient.delete(`/api/attendance/shifts/${id}`);
}

// ── Employees ─────────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  const res = await apiClient.get<Employee[]>("/api/attendance/employees");
  return res.data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const res = await apiClient.get<Employee>(`/api/attendance/employees/${id}`);
  return res.data;
}

export async function createEmployee(
  request: CreateEmployeeRequest
): Promise<Employee> {
  const res = await apiClient.post<Employee>(
    "/api/attendance/employees",
    request
  );
  return res.data;
}

export async function updateEmployee(
  id: number,
  request: UpdateEmployeeRequest
): Promise<Employee> {
  const res = await apiClient.put<Employee>(
    `/api/attendance/employees/${id}`,
    request
  );
  return res.data;
}

export async function updateEmployeeShift(
  employeeId: number,
  shiftId: number
): Promise<void> {
  await apiClient.put(
    `/api/attendance/employees/${employeeId}/shift?shiftId=${shiftId}`
  );
}

// ── Punch ─────────────────────────────────────────────────────────────────────

export async function webPunch(): Promise<WebPunchResponse> {
  const res = await apiClient.post<WebPunchResponse>("/api/attendance/punch");
  return res.data;
}

export async function getMyProfile(): Promise<Employee> {
  const res = await apiClient.get<Employee>("/api/attendance/employees/me");
  return res.data;
}

// ── Simulator ─────────────────────────────────────────────────────────────────

export async function simulatePunch(
  request: SimulatePunchRequest
): Promise<void> {
  await apiClient.post("/api/dev/attendance/simulate", request);
}

// ── Regularization ────────────────────────────────────────────────────────────

export interface RegularizationListParams {
  status?: RegularizationStatus;
  page?: number;
  size?: number;
}

export interface RegularizationAllParams extends RegularizationListParams {
  employeeCode?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: RegularizationType;
}

export async function submitRegularization(
  request: SubmitRegularizationRequest
): Promise<RegularizationRequestResponse> {
  const res = await apiClient.post<RegularizationRequestResponse>(
    "/api/attendance/regularization",
    request
  );
  return res.data;
}

export async function getMyRegularizations(
  params: RegularizationListParams
): Promise<RegularizationRequestPage> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  const res = await apiClient.get<RegularizationRequestPage>(
    `/api/attendance/regularization/my?${q}`
  );
  return res.data;
}

export async function getRegularizationById(
  id: number
): Promise<RegularizationRequestResponse> {
  const res = await apiClient.get<RegularizationRequestResponse>(
    `/api/attendance/regularization/${id}`
  );
  return res.data;
}

export async function cancelRegularization(
  id: number
): Promise<RegularizationRequestResponse> {
  const res = await apiClient.post<RegularizationRequestResponse>(
    `/api/attendance/regularization/${id}/cancel`
  );
  return res.data;
}

export async function approveRegularization(
  id: number
): Promise<RegularizationRequestResponse> {
  const res = await apiClient.post<RegularizationRequestResponse>(
    `/api/attendance/regularization/${id}/approve`
  );
  return res.data;
}

export async function rejectRegularization(
  id: number,
  request: RejectRegularizationRequest
): Promise<RegularizationRequestResponse> {
  const res = await apiClient.post<RegularizationRequestResponse>(
    `/api/attendance/regularization/${id}/reject`,
    request
  );
  return res.data;
}

export async function getPendingRegularizations(
  params: RegularizationListParams
): Promise<RegularizationRequestPage> {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  const res = await apiClient.get<RegularizationRequestPage>(
    `/api/attendance/regularization/pending?${q}`
  );
  return res.data;
}

export async function getPendingCount(): Promise<number> {
  const res = await apiClient.get<{ count: number }>(
    "/api/attendance/regularization/pending/count"
  );
  return res.data.count;
}

export async function getAllRegularizations(
  params: RegularizationAllParams
): Promise<RegularizationRequestPage> {
  const q = new URLSearchParams();
  if (params.employeeCode) q.set("employeeCode", params.employeeCode);
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  if (params.status) q.set("status", params.status);
  if (params.type) q.set("type", params.type);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  const res = await apiClient.get<RegularizationRequestPage>(
    `/api/attendance/regularization/all?${q}`
  );
  return res.data;
}

export async function uploadAttachment(
  requestId: number,
  file: File
): Promise<RegularizationAttachmentResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<RegularizationAttachmentResponse>(
    `/api/attendance/regularization/${requestId}/attachments`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  await apiClient.delete(
    `/api/attendance/regularization/attachments/${attachmentId}`
  );
}

export function getAttachmentDownloadUrl(attachmentId: number): string {
  return `/api/attendance/regularization/attachments/${attachmentId}/download`;
}
