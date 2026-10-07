'use client'

import { Coffee, Clock, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { useMyOrders } from '@/hooks/useOrders'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function MyOrdersPage() {
  const { orders, isLoading, isError, error, refetch, cancelOrder, isCancelling } = useMyOrders()

  const handleCancel = async (orderId: number, beverageName: string) => {
    try {
      await cancelOrder(orderId)
      toast.success(`Cancelled order for ${beverageName}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Orders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your personal beverage order history</p>
        </div>
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

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-destructive">{error ?? 'Failed to load order history'}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-0">
            <EmptyState
              icon={Coffee}
              title="No beverage orders yet"
              description="You haven't placed any beverage orders. Join the next open round to order tea or coffee!"
              action={{ label: 'Order a Beverage', href: '/dashboard/order' }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Recent Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {orders.map((order) => {
              const orderDate = new Date(order.createdAt)
              const formattedDate = orderDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
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
                        <span className="font-semibold text-foreground text-sm">{order.beverageName}</span>
                        <Badge variant="outline" className="text-xs bg-muted/40 font-normal">
                          {order.roundName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formattedDate} at {formattedTimeStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(order.orderId, order.beverageName)}
                      disabled={isCancelling}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
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
