'use client'

import { useAuth } from '@/hooks/useAuth'
import { getDashboardPath } from '@/types/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    router.replace(getDashboardPath(user!.role))
  }, [isAuthenticated, isLoading, user, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
    </div>
  )
}
