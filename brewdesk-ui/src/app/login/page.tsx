'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { setTemporaryPassword } from '@/lib/tempPassword'
import { getErrorMessage } from '@/lib/utils'
import { LoginFormValues, loginSchema } from '@/schemas/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Coffee, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { getDashboardPath } from '@/types/auth'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated && user) {
      if (user.mustChangePassword) {
        router.replace('/change-password')
        return
      }
      router.replace(getDashboardPath(user.role))
    }
  }, [isAuthenticated, authLoading, user, router])

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      // Store password in memory for potential password change flow
      setTemporaryPassword(values.password)
      await login(values)
      toast.success('Welcome back!')
    } catch (err) {
      const msg = getErrorMessage(err)
      // Show error on the password field if it looks like invalid credentials
      if (msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('unauthorized')) {
        setError('password', { message: 'Invalid email or password.' })
      } else {
        toast.error(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    )
  }

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
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@brewdesk.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
