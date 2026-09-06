import apiClient from '@/lib/api'
import { LoginRequest, LoginResponse, ChangePasswordRequest } from '@/types/auth'

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', data)
  return response.data
}

export async function changePasswordApi(data: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/api/auth/change-password', data)
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/api/auth/logout')
}
