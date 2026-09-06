'use client'

import { loginApi, logoutApi } from '@/api/auth'
import { clearSession, getStoredToken, getStoredUser, isTokenExpired, saveSession } from '@/lib/auth'
import { AuthUser, LoginRequest, getDashboardPath } from '@/types/auth'
import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useEffect, useState } from 'react'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  updateMustChangePassword: (value: boolean) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const storedToken = getStoredToken()
    const storedUser = getStoredUser()
    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      setToken(storedToken)
      setUser(storedUser)
    } else if (storedToken) {
      // Token exists but is expired — clear it
      clearSession()
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await loginApi(data)
    saveSession(response)
    setToken(response.token)
    setUser({
      name: response.name,
      email: response.email,
      role: response.role,
      mustChangePassword: response.mustChangePassword,
    })
    // Redirect to change password if required, otherwise role-based redirect
    if (response.mustChangePassword) {
      router.push('/change-password')
    } else {
      router.push(getDashboardPath(response.role))
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      // Call backend logout API
      await logoutApi()
    } catch (error) {
      // Continue with local logout even if backend fails
      console.error('Logout API failed:', error)
    } finally {
      // Always clear local session
      clearSession()
      setToken(null)
      setUser(null)
      router.push('/login')
    }
  }, [router])

  const updateMustChangePassword = useCallback((value: boolean) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, mustChangePassword: value }
      localStorage.setItem('brewdesk_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
