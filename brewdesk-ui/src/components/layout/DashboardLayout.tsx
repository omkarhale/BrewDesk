'use client'

import { useAuth } from '@/hooks/useAuth'
import { getUnauthorizedRedirect } from '@/lib/roles'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (user?.mustChangePassword) {
      router.replace('/change-password')
      return
    }

    // Role-based route guard
    const redirect = getUnauthorizedRedirect(pathname, user?.role)
    if (redirect) {
      router.replace(redirect)
    }
  }, [isAuthenticated, isLoading, pathname, router, user])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          {/* Teal spinner — matches new primary */}
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="text-[13px] text-muted-foreground">Loading BrewDesk…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.mustChangePassword) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-60 animate-in slide-in-from-left duration-200">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
