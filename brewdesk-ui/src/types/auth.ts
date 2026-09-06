export type Role = 'ADMIN' | 'MAKER' | 'EMPLOYEE'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  name: string
  email: string
  role: Role
  mustChangePassword: boolean
}

// The user object stored in context / localStorage
// employeeId is decoded from the JWT payload (sub claim is email, id not present)
// We store what we get from the login response plus a numeric id parsed from the token if available
export interface AuthUser {
  name: string
  email: string
  role: Role
  mustChangePassword: boolean
  // employeeId is required by POST /api/orders; backend seeds: admin=1, maker=2, employee=3
  // We extract it by decoding the JWT — if the backend ever adds an `id` claim this will use it,
  // otherwise the consumer must handle the case where it's undefined.
  employeeId?: number
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
