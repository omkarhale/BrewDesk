import apiClient from '@/lib/api'
import {
  UserResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  ResetPasswordResponse,
} from '@/types/user'

export async function getUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<UserResponse[]>('/api/admin/users/users')
  return response.data
}

export async function createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await apiClient.post<CreateUserResponse>('/api/admin/users/users', request)
  return response.data
}

export async function updateUser(id: number, request: UpdateUserRequest): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>(`/api/admin/users/users/${id}`, request)
  return response.data
}

export async function disableUser(id: number): Promise<void> {
  await apiClient.patch(`/api/admin/users/${id}/disable`)
}

export async function enableUser(id: number): Promise<void> {
  await apiClient.patch(`/api/admin/users/${id}/enable`)
}

export async function resetPassword(id: number): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ResetPasswordResponse>(`/api/admin/users/${id}/reset-password`)
  return response.data
}
