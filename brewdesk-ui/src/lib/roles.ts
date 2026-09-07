/**
 * Route-level role guard configuration.
 *
 * Maps route prefixes to the roles that are allowed to access them.
 * DashboardLayout checks this on every navigation.
 * More specific paths must come before generic prefixes.
 */
import { MANAGEMENT_ROLES, Role } from '@/types/auth'

export interface RouteGuard {
  path: string
  /** Roles allowed. Empty = any authenticated user. */
  allowedRoles: Role[]
  /** Exact match only (default: startsWith) */
  exact?: boolean
}

export const ROUTE_GUARDS: RouteGuard[] = [
  // Super-admin + admin only
  { path: '/dashboard/admin',                     allowedRoles: MANAGEMENT_ROLES },
  { path: '/admin/users',                         allowedRoles: MANAGEMENT_ROLES },
  { path: '/dashboard/attendance/simulator',      allowedRoles: MANAGEMENT_ROLES },
  { path: '/dashboard/attendance/departments',    allowedRoles: MANAGEMENT_ROLES },
  { path: '/dashboard/attendance/employees',      allowedRoles: MANAGEMENT_ROLES },
  { path: '/dashboard/attendance/shifts',         allowedRoles: MANAGEMENT_ROLES },
  { path: '/dashboard/attendance/records',        allowedRoles: MANAGEMENT_ROLES },
  { path: '/dashboard/attendance',                allowedRoles: MANAGEMENT_ROLES, exact: true },

  // Reporting manager + management
  { path: '/dashboard/manager',                   allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REPORTING_MANAGER'] },
  { path: '/dashboard/attendance/team',           allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REPORTING_MANAGER'] },

  // Chef (pantry operator) + management
  { path: '/dashboard/chef',                      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CHEF'] },
  { path: '/dashboard/orders',                    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CHEF'] },
  { path: '/dashboard/summary',                   allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CHEF'] },
  { path: '/dashboard/beverages',                 allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CHEF'] },

  // All staff (have employee profiles)
  { path: '/dashboard/attendance/my', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'REPORTING_MANAGER', 'CHEF', 'EMPLOYEE'] },
]

/**
 * Returns the redirect path if the user's role is not allowed on the given path,
 * or null if access is permitted.
 */
export function getUnauthorizedRedirect(
  pathname: string,
  role: Role | undefined,
): string | null {
  if (!role) return '/login'

  // Find the most specific matching guard
  const guard = ROUTE_GUARDS
    .filter(g => g.exact ? pathname === g.path : pathname.startsWith(g.path))
    .sort((a, b) => b.path.length - a.path.length)[0]

  if (!guard) return null // no guard = open to all authenticated users
  if (guard.allowedRoles.length === 0) return null
  if (guard.allowedRoles.includes(role)) return null

  // Redirect to their own dashboard
  import('@/types/auth').then(() => {}) // tree-shake safe
  return '/unauthorized'
}
