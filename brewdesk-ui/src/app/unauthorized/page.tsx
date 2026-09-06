'use client'

import { ShieldOff, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardPath } from '@/types/auth'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleBack = () => {
    if (user) {
      router.replace(getDashboardPath(user.role))
    } else {
      router.replace('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
            <ShieldOff className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view this page.
            Contact your administrator if you think this is a mistake.
          </p>
        </div>
        <Button onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
