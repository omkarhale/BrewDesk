import { Role } from './auth'

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: Role;
}

export interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  temporaryPassword: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: Role;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
}
