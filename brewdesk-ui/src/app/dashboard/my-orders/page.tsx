'use client'

import { Coffee, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/EmptyState'

/**
 * TODO: A dedicated "my orders" endpoint does not exist in the current backend.
 * The backend has no GET /api/orders or GET /api/orders/my endpoint yet.
 * When the backend implements it, replace the placeholder below with real data.
 *
 * Expected future endpoint:
 *   GET /api/orders/my   → OrderResponse[]  (filtered by authenticated user)
 */
export default function MyOrdersPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold">My Orders</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your beverage order history</p>
      </div>

      {/* Placeholder — endpoint not yet available */}
      <Card className="border-dashed">
        <CardContent className="p-0">
          <EmptyState
            icon={Coffee}
            title="Order history coming soon"
            description="The backend endpoint for fetching personal order history has not been implemented yet. Once GET /api/orders/my is available, your orders will appear here."
            action={{ label: 'Order a Beverage', href: '/dashboard/order' }}
          />
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            After placing an order in the current round, your confirmed order will appear here once
            the history endpoint is available.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
