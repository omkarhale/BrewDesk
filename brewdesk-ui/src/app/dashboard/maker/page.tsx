'use client'

import { useState } from 'react'
import { Coffee, Clock, Layers, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRounds } from '@/hooks/useRounds'
import { useRoundSummary } from '@/hooks/useRounds'
import { getGreeting, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RoundStatusBadge } from '@/components/dashboard/RoundStatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

function RoundSummaryPanel({ roundId, roundName }: { roundId: number; roundName: string }) {
  const { summary, isLoading, error, refetch } = useRoundSummary(roundId)

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />

  if (!summary || summary.beverages.length === 0) {
    return (
      <EmptyState
        icon={Coffee}
        title="No orders yet"
        description={`No beverages ordered for the ${roundName} round.`}
      />
    )
  }

  const maxCount = Math.max(...summary.beverages.map((b) => b.count))

  return (
    <div className="space-y-4 pt-2">
      {summary.beverages.map((bev) => (
        <div key={bev.beverageName} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xl">
            {bev.icon || '☕'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm">{bev.beverageName}</p>
              <p className="text-sm font-bold tabular-nums">{bev.count} cups</p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${maxCount > 0 ? (bev.count / maxCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      ))}

      <Separator />
      <div className="flex items-center justify-between pt-1">
        <p className="text-sm font-semibold text-muted-foreground">Total</p>
        <p className="text-xl font-bold text-foreground">{summary.totalOrders} cups</p>
      </div>
    </div>
  )
}

export default function MakerDashboard() {
  const { user } = useAuth()
  const { rounds, isLoading, error, refetch } = useRounds()
  const [activeTab, setActiveTab] = useState<string>('')

  const openRound = rounds.find((r) => r.status === 'OPEN')
  const defaultTab = activeTab || (rounds[0] ? String(rounds[0].id) : '')

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="mt-1 text-muted-foreground">
            {openRound
              ? `${openRound.name} round is open — time to brew!`
              : 'No round open right now. Check the schedule below.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Round status strip */}
      {!isLoading && !error && (
        <div className="flex flex-wrap gap-3">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{round.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(round.startTime)} – {formatTime(round.cutoffTime)}
                </p>
              </div>
              <RoundStatusBadge status={round.status} />
            </div>
          ))}
        </div>
      )}

      {/* Beverage summary per round */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Layers className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle>Today&apos;s Beverage Orders</CardTitle>
              <CardDescription>Cups to prepare per round</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-64 rounded-lg" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : rounds.length === 0 ? (
            <EmptyState icon={Coffee} title="No rounds today" description="No beverage rounds are scheduled." />
          ) : (
            <Tabs value={defaultTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {rounds.map((round) => (
                  <TabsTrigger key={round.id} value={String(round.id)} className="gap-2">
                    {round.name}
                    <RoundStatusBadge status={round.status} className="text-[9px] px-1.5 py-0 h-4" />
                  </TabsTrigger>
                ))}
              </TabsList>
              {rounds.map((round) => (
                <TabsContent key={round.id} value={String(round.id)}>
                  <RoundSummaryPanel roundId={round.id} roundName={round.name} />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
