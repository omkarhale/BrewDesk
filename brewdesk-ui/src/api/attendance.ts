import apiClient from '@/lib/api'
import {
    AttendanceCalculationResponse,
    AttendanceRecordsPage,
    AttendanceRecordsParams,
    CreateDepartmentRequest,
    CreateEmployeeRequest,
    CreateShiftRequest,
    Department,
    Employee,
    Shift,
    SimulatePunchRequest,
} from '@/types/attendance'

// Attendance Calculation
export async function calculateAttendance(
  employeeCode: string,
  attendanceDate: string
): Promise<AttendanceCalculationResponse> {
  const response = await apiClient.post<AttendanceCalculationResponse>(
    `/api/attendance/calculation?employeeCode=${encodeURIComponent(employeeCode)}&attendanceDate=${encodeURIComponent(attendanceDate)}`
  )
  return response.data
}

// Departments
export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get<Department[]>('/api/attendance/departments')
  return response.data
}

export async function createDepartment(request: CreateDepartmentRequest): Promise<Department> {
  const response = await apiClient.post<Department>('/api/attendance/departments', request)
  return response.data
}

// Employees
export async function getEmployees(): Promise<Employee[]> {
  const response = await apiClient.get<Employee[]>('/api/attendance/employees')
  return response.data
}

export async function getEmployee(id: number): Promise<Employee> {
  const response = await apiClient.get<Employee>(`/api/attendance/employees/${id}`)
  return response.data
}

export async function createEmployee(request: CreateEmployeeRequest): Promise<Employee> {
  const response = await apiClient.post<Employee>('/api/attendance/employees', request)
  return response.data
}

export async function updateEmployeeShift(employeeId: number, shiftId: number): Promise<void> {
  await apiClient.put(`/api/attendance/employees/${employeeId}/shift?shiftId=${shiftId}`)
}

// Shifts
export async function getShifts(): Promise<Shift[]> {
  const response = await apiClient.get<Shift[]>('/api/attendance/shifts')
  return response.data
}

export async function createShift(request: CreateShiftRequest): Promise<Shift> {
  const response = await apiClient.post<Shift>('/api/attendance/shifts', request)
  return response.data
}

// Punch Simulator
export async function simulatePunch(request: SimulatePunchRequest): Promise<void> {
  await apiClient.post('/api/dev/attendance/simulate', request)
}

// Attendance Records
export async function getAttendanceRecords(
  params: AttendanceRecordsParams
): Promise<AttendanceRecordsPage> {
  const query = new URLSearchParams()
  if (params.employeeCode) query.set('employeeCode', params.employeeCode)
  if (params.dateFrom)     query.set('dateFrom', params.dateFrom)
  if (params.dateTo)       query.set('dateTo', params.dateTo)
  if (params.status)       query.set('status', params.status)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 20))

  const response = await apiClient.get<AttendanceRecordsPage>(
    `/api/attendance/records?${query.toString()}`
  )
  return response.data
}
