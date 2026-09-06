'use client'

import { ClipboardList, Search } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/dashboard/EmptyState'

/**
 * TODO: A general orders list endpoint does not exist in the current backend.
 * Expected future endpoints (once implemented):
 *   GET /api/orders              → OrderResponse[]   (ADMIN/MAKER)
 *   GET /api/orders?roundId={id} → OrderResponse[]   (filter by round)
 *
 * The round summary endpoint exists: GET /api/rounds/{roundId}/summary
 * which returns aggregate counts per beverage. That is used in the Maker Dashboard.
 */
export default function OrdersPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All beverage orders across rounds</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Backend endpoint not yet available
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <EmptyState
            icon={ClipboardList}
            title="Orders list coming soon"
            description="The backend endpoint for listing all orders (GET /api/orders) has not been implemented yet. The round summary showing aggregate beverage counts is available in the Maker Dashboard."
            action={{ label: 'View Beverage Summary', href: '/dashboard/summary' }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
