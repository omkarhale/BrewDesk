'use client'

import { changePasswordApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { clearTemporaryPassword, getTemporaryPassword } from '@/lib/tempPassword'
import { ChangePasswordRequest } from '@/types/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Coffee, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

import { getDashboardPath } from '@/types/auth'

export default function ChangePasswordPage() {
  const { user, logout, updateMustChangePassword } = useAuth()
  const router = useRouter()
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')

  // Redirect if not authenticated or doesn't need password change
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.mustChangePassword) {
      router.replace(getDashboardPath(user.role))
    }
  }, [user, router])

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsSubmitting(true)
    try {
      const currentPassword = getTemporaryPassword()
      if (!currentPassword) {
        toast.error('Session expired. Please login again.')
        router.push('/login')
        return
      }

      const request: ChangePasswordRequest = {
        currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }

      await changePasswordApi(request)
      
      // Clear temporary password from memory
      clearTemporaryPassword()
      
      // Update auth state
      updateMustChangePassword(false)
      
      // Show success state
      setIsSuccess(true)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push(getDashboardPath(user!.role))
      }, 2000)
      
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to change password'
      
      if (message.toLowerCase().includes('current') || message.toLowerCase().includes('incorrect')) {
        toast.error('The current password is incorrect.')
      } else if (message.toLowerCase().includes('match')) {
        toast.error('Passwords do not match.')
      } else {
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user || !user.mustChangePassword) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10 px-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5 dark:shadow-black/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Password updated</h2>
                <p className="text-muted-foreground">
                  Your password has been successfully changed.
                </p>
                <p className="text-sm text-muted-foreground">
                  Taking you to your dashboard...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const passwordRequirements = [
    { text: 'At least 8 characters', met: newPassword.length >= 8 },
    { text: 'Passwords match', met: newPassword === watch('confirmPassword') && newPassword.length > 0 },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
            <Coffee className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">BrewDesk</h1>
          <p className="text-muted-foreground text-sm">Your office beverage companion</p>
        </div>

        {/* Card */}
        <Card className="border-border/60 shadow-xl shadow-black/5 dark:shadow-black/30">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create your password</CardTitle>
            <CardDescription>
              You're using a temporary password. Create a new password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pr-10"
                    aria-invalid={!!errors.newPassword}
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pr-10"
                    aria-invalid={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Password requirements</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.text} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                      )}
                      <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting password…
                  </>
                ) : (
                  'Set new password'
                )}
              </Button>
            </form>

            {/* Cancel option */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel and sign out
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
