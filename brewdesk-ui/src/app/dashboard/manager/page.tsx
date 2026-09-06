'use client'

import { Users, TrendingUp, Clock, CalendarDays } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getGreeting } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ManagerDashboard() {
  const { user } = useAuth()

  const quickLinks = [
    {
      title: 'My Attendance',
      description: 'View your personal attendance, punch in/out, and monthly calendar.',
      href: '/dashboard/attendance/my',
      icon: CalendarDays,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Team Attendance',
      description: 'Monitor your team\'s daily attendance records and status.',
      href: '/dashboard/attendance/team',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ]

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">
          Welcome to your manager dashboard. Monitor your team and track your own attendance.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Card key={link.href} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.bg}`}>
                    <Icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                </div>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={link.href}>Open →</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info panel */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="flex items-start gap-3 p-5">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Manager Scope</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              You can view attendance for employees who report directly to you.
              Contact HR if you need access to additional team members.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
