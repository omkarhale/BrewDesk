'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function RouteGuard({ children, requireAuth = true }: RouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // If not authenticated and auth is required, redirect to login
    if (requireAuth && !isAuthenticated) {
      router.push('/login')
      return
    }

    // If authenticated but must change password, redirect to change-password
    // unless already on change-password page
    if (isAuthenticated && user?.mustChangePassword) {
      const currentPath = window.location.pathname
      if (currentPath !== '/change-password') {
        router.push('/change-password')
      }
    }
  }, [isAuthenticated, user, isLoading, router, requireAuth])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    )
  }

  // If auth is required and not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // If authenticated but must change password and not on change-password page, don't render
  if (isAuthenticated && user?.mustChangePassword && window.location.pathname !== '/change-password') {
    return null
  }

  return <>{children}</>
}
