// Role hierarchy (highest → lowest privilege)
export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'REPORTING_MANAGER'
  | 'CHEF'
  | 'EMPLOYEE'

// ── Role helpers ─────────────────────────────────────────────────────────────

/** Roles that have full HR / system admin access */
export const MANAGEMENT_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN']

/** Roles that have an employee profile and can punch in/out */
export const STAFF_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'REPORTING_MANAGER',
  'CHEF',
  'EMPLOYEE',
]

/** Roles that manage pantry operations */
export const PANTRY_ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'CHEF']

export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  if (!userRole) return false
  return allowed.includes(userRole)
}

export function isManagement(role: Role | undefined): boolean {
  return hasRole(role, MANAGEMENT_ROLES)
}

export function isSuperAdmin(role: Role | undefined): boolean {
  return role === 'SUPER_ADMIN'
}

/** Landing page per role after login */
export function getDashboardPath(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/dashboard/admin'
    case 'REPORTING_MANAGER':
      return '/dashboard/manager'
    case 'CHEF':
      return '/dashboard/chef'
    case 'EMPLOYEE':
    default:
      return '/dashboard'
  }
}

// ── Auth interfaces ───────────────────────────────────────────────────────────

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

export interface AuthUser {
  name: string
  email: string
  role: Role
  mustChangePassword: boolean
  employeeId?: number
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
