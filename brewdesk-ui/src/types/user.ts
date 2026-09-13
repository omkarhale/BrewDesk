import { Role } from './auth'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface UserResponse {
  id: number
  name: string
  email: string
  role: Role
  gender: Gender | null
  active: boolean
  mustChangePassword: boolean
  createdAt: string
}

export interface CreateUserRequest {
  name: string
  email: string
  role: Role
  gender: Gender
}

export interface CreateUserResponse {
  id: number
  name: string
  email: string
  role: Role
  temporaryPassword: string
}

export interface UpdateUserRequest {
  name: string
  email: string
  role: Role
  gender: Gender
}

export interface ResetPasswordResponse {
  temporaryPassword: string
}
