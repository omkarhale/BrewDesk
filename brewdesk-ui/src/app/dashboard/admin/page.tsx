'use client'

import { Users, Coffee, Clock, Layers, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRounds } from '@/hooks/useRounds'
import { getGreeting } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RoundStatusBadge } from '@/components/dashboard/RoundStatusBadge'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { formatTime } from '@/lib/utils'

/**
 * Admin dashboard uses only confirmed backend endpoints:
 *   GET /api/rounds/today   → Round[]
 *
 * TODO: When the backend implements /api/admin/** routes, add:
 *   GET /api/admin/users/count     → { total, active }
 *   GET /api/admin/beverages/count → { total }
 *   GET /api/admin/orders/count    → { today }
 */

function RoundCard({ label, count, desc }: { label: string; count: string | number; desc?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold">{count}</p>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { rounds, isLoading, error, refetch } = useRounds(true)

  const openCount = rounds.filter((r) => r.status === 'OPEN').length
  const closedCount = rounds.filter((r) => r.status === 'CLOSED').length
  const upcomingCount = rounds.filter((r) => r.status === 'UPCOMING').length

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="mt-1 text-muted-foreground">Admin overview — BrewDesk control centre</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stat cards — real data from rounds, placeholders for future admin endpoints */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Users</p>
                <p className="mt-1 text-2xl font-bold">—</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Admin endpoint pending</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Beverages</p>
                <p className="mt-1 text-2xl font-bold">—</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Coffee className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Admin endpoint pending</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <>
            <Card><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          </>
        ) : (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Rounds</p>
                    <p className="mt-1 text-2xl font-bold">{openCount}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  {openCount > 0 ? 'Accepting orders' : 'No open rounds'}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today&apos;s Rounds</p>
                    <p className="mt-1 text-2xl font-bold">{rounds.length}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <Layers className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {closedCount} closed · {upcomingCount} upcoming
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Today's rounds detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Round Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{round.name} Round</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(round.startTime)} – {formatTime(round.cutoffTime)}
                    </p>
                  </div>
                  <RoundStatusBadge status={round.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending admin features notice */}
      <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Admin endpoints not yet available</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            The backend has not implemented <code>/api/admin/**</code> routes yet. User management, beverage management, and order reporting will be activated once these endpoints are live.
          </p>
        </div>
      </div>
    </div>
  )
}
