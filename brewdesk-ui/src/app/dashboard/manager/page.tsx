'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useMyTeamQuery } from '@/hooks/useEmployeeManagement'
import { cn, getGreeting } from '@/lib/utils'
import { Building2, CalendarDays, Clock, TrendingUp, UserCircle2, Users } from 'lucide-react'
import Link from 'next/link'

export default function ManagerDashboard() {
  const { user }                               = useAuth()
  const { data: team = [], isLoading: teamLoading } = useMyTeamQuery()

  const activeCount   = team.filter((m) => m.active).length
  const inactiveCount = team.length - activeCount

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">
          Manage your team and track attendance from here.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Team Size
          </p>
          {teamLoading
            ? <Skeleton className="h-8 w-12 mt-1" />
            : <p className="text-3xl font-bold mt-1">{team.length}</p>}
          <p className="text-xs text-muted-foreground mt-1">direct reports</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 px-5 py-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wide">
            Active
          </p>
          {teamLoading
            ? <Skeleton className="h-8 w-12 mt-1" />
            : <p className="text-3xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{activeCount}</p>}
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">employees</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 px-5 py-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Inactive
          </p>
          {teamLoading
            ? <Skeleton className="h-8 w-12 mt-1" />
            : <p className="text-3xl font-bold mt-1 text-muted-foreground">{inactiveCount}</p>}
          <p className="text-xs text-muted-foreground mt-1">employees</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <CalendarDays className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-base">My Attendance</CardTitle>
            </div>
            <CardDescription>
              View your personal attendance, punch in/out, and monthly calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/attendance/my">Open →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base">Team Attendance</CardTitle>
            </div>
            <CardDescription>
              Monitor your team&apos;s daily attendance records and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/attendance/team">Open →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Team members list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">My Team</CardTitle>
              <Badge variant="secondary" className="text-xs">{team.length}</Badge>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/dashboard/attendance/team">View attendance →</Link>
            </Button>
          </div>
          <CardDescription>
            Employees who report directly to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : team.length === 0 ? (
            <div className="py-8 text-center">
              <UserCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No team members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask your HR admin to assign employees to your reporting line.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Name + code */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {member.userName ?? member.employeeCode}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        {member.employeeCode}
                      </span>
                      {member.designation && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground">
                            {member.designation}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dept */}
                  {member.departmentName && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{member.departmentName}</span>
                    </div>
                  )}

                  {/* Shift */}
                  {member.shiftName && (
                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{member.shiftName}</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0',
                    member.active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full',
                      member.active ? 'bg-emerald-500' : 'bg-slate-400')} />
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope info */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="flex items-start gap-3 p-5">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Manager Scope
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              You can only view attendance for employees listed above.
              Contact HR to add or reassign team members.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
