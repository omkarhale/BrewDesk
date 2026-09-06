'use client'

import { useState } from 'react'
import { Layers, RefreshCw } from 'lucide-react'
import { useRounds } from '@/hooks/useRounds'
import { useRoundSummary } from '@/hooks/useRounds'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RoundStatusBadge } from '@/components/dashboard/RoundStatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function SummaryContent({ roundId }: { roundId: number }) {
  const { summary, isLoading, error, refetch } = useRoundSummary(roundId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />

  if (!summary || summary.beverages.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No orders yet"
        description="No beverages have been ordered for this round yet."
      />
    )
  }

  const maxCount = Math.max(...summary.beverages.map((b) => b.count))

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="rounded-xl border border-border bg-muted/50 p-4 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
        <p className="text-3xl font-bold text-foreground">{summary.totalOrders}</p>
      </div>

      {/* Per-beverage breakdown */}
      <div className="space-y-2">
        {summary.beverages.map((bev) => (
          <div key={bev.beverageName} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xl">
              {bev.icon || '☕'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-medium text-sm">{bev.beverageName}</p>
                <span className="text-sm font-bold tabular-nums">{bev.count} cups</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${maxCount > 0 ? (bev.count / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SummaryPage() {
  const { rounds, isLoading: roundsLoading, error: roundsError, refetch } = useRounds()
  const [activeTab, setActiveTab] = useState<string>('')

  // Default to first round
  const defaultRound = rounds[0]
  const tabValue = activeTab || (defaultRound ? String(defaultRound.id) : '')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Beverage Summary</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Order counts per beverage for each round</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={roundsLoading}>
          <RefreshCw className={`h-4 w-4 ${roundsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {roundsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        </div>
      ) : roundsError ? (
        <ErrorState message={roundsError} onRetry={refetch} />
      ) : rounds.length === 0 ? (
        <EmptyState icon={Layers} title="No rounds today" description="No rounds are scheduled for today." />
      ) : (
        <Tabs value={tabValue} onValueChange={setActiveTab}>
          <TabsList>
            {rounds.map((round) => (
              <TabsTrigger key={round.id} value={String(round.id)} className="gap-2">
                {round.name}
                <RoundStatusBadge status={round.status} className="text-[9px] px-1.5 py-0 h-4" />
              </TabsTrigger>
            ))}
          </TabsList>
          {rounds.map((round) => (
            <TabsContent key={round.id} value={String(round.id)} className="mt-4">
              <SummaryContent roundId={round.id} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
