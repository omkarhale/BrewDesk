'use client'

import { ClipboardList, Search, RefreshCw, Clock, Coffee, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { useAllOrders } from '@/hooks/useOrders'
import { useRounds } from '@/hooks/useRounds'

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [selectedRoundId, setSelectedRoundId] = useState<number | undefined>(undefined)

  const { rounds } = useRounds()
  const { orders, isLoading, isError, error, refetch } = useAllOrders(selectedRoundId)

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders
    const query = search.toLowerCase()
    return orders.filter(
      (o) =>
        o.employeeName?.toLowerCase().includes(query) ||
        o.beverageName?.toLowerCase().includes(query) ||
        o.roundName?.toLowerCase().includes(query)
    )
  }, [orders, search])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">All Orders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time overview of beverage orders across rounds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-border hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee, beverage, or round…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={selectedRoundId === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRoundId(undefined)}
            className={selectedRoundId === undefined ? 'bg-primary text-primary-foreground' : 'border-border'}
          >
            All Rounds
          </Button>
          {rounds.map((round) => (
            <Button
              key={round.id}
              variant={selectedRoundId === round.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRoundId(round.id)}
              className={selectedRoundId === round.id ? 'bg-primary text-primary-foreground' : 'border-border'}
            >
              {round.name}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-destructive">{error ?? 'Failed to load orders'}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-0">
            <EmptyState
              icon={ClipboardList}
              title="No orders found"
              description={search ? 'No orders match your search criteria.' : 'No orders have been placed for this round yet.'}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Orders Queue ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {filteredOrders.map((order) => {
              const orderDate = new Date(order.createdAt)
              const formattedTimeStr = orderDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={order.orderId} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg border border-emerald-200/50 dark:border-emerald-800/40">
                      {order.beverageIcon || '☕'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{order.employeeName}</span>
                        <Badge variant="outline" className="text-xs bg-muted/40 font-normal">
                          {order.roundName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Coffee className="h-3 w-3 text-emerald-600" />
                        Selected: <span className="font-medium text-foreground">{order.beverageName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {formattedTimeStr}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
