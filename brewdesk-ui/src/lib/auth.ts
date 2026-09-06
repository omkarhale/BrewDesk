import { AuthUser, LoginResponse } from '@/types/auth'
import { decodeJwtPayload } from './utils'

const TOKEN_KEY = 'brewdesk_token'
const USER_KEY = 'brewdesk_user'

export function saveSession(response: LoginResponse): void {
  const payload = decodeJwtPayload(response.token)
  const employeeId = typeof payload.id === 'number' ? payload.id : undefined

  const user: AuthUser = {
    name: response.name,
    email: response.email,
    role: response.role,
    mustChangePassword: response.mustChangePassword,
    employeeId,
  }
  localStorage.setItem(TOKEN_KEY, response.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token)
    const exp = typeof payload.exp === 'number' ? payload.exp : 0
    return Date.now() / 1000 > exp
  } catch {
    return true
  }
}
