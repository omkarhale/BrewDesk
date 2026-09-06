'use client'

import { Coffee, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRounds } from '@/hooks/useRounds'
import { getGreeting, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RoundStatusBadge } from '@/components/dashboard/RoundStatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { rounds, isLoading, error, refetch } = useRounds()

  const openRound = rounds.find((r) => r.status === 'OPEN')
  const upcomingRound = rounds.find((r) => r.status === 'UPCOMING')
  const activeRound = openRound ?? upcomingRound

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">Here&apos;s your BrewDesk overview for today.</p>
      </div>

      {/* Cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Current Round card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Round</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : error ? (
              <p className="text-sm text-muted-foreground">Unable to load round.</p>
            ) : activeRound ? (
              <>
                <div>
                  <p className="font-semibold text-foreground">{activeRound.name} Round</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(activeRound.startTime)} – {formatTime(activeRound.cutoffTime)}
                  </p>
                </div>
                <RoundStatusBadge status={activeRound.status} />
                {activeRound.status === 'OPEN' && (
                  <Button asChild size="sm" className="w-full mt-2">
                    <Link href="/dashboard/order">
                      <Coffee className="h-3.5 w-3.5" />
                      Order Beverage
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">No active round today.</p>
                <RoundStatusBadge status="CLOSED" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick order card */}
        <Card className="hover:shadow-md transition-shadow duration-200 border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Order</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Coffee className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {openRound
                ? 'A round is open. Select your beverage now.'
                : 'No open round at the moment.'}
            </p>
            <Button
              asChild
              variant={openRound ? 'default' : 'outline'}
              size="sm"
              className="w-full"
            >
              <Link href="/dashboard/order">
                {openRound ? '☕ Order Now' : 'View Beverages'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* My orders card */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Orders</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">View your beverage order history.</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/my-orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* All rounds today */}
      <div>
        <h3 className="text-base font-semibold mb-4">Today&apos;s Rounds</h3>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : rounds.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No rounds today"
            description="No beverage rounds have been scheduled for today."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rounds.map((round) => (
              <Card key={round.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{round.name} Round</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(round.startTime)} – {formatTime(round.cutoffTime)}
                      </p>
                    </div>
                    <RoundStatusBadge status={round.status} />
                  </div>
                  {round.status === 'OPEN' && (
                    <Button asChild size="sm" className="mt-4 w-full">
                      <Link href="/dashboard/order">
                        <Coffee className="h-3.5 w-3.5" />
                        Order Now
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
