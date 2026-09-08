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
  Shift,
  SimulatePunchRequest,
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

// ── My profile ────────────────────────────────────────────────────────────────

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
