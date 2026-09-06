'use client'

import { Users, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/EmptyState'

/**
 * TODO: Backend does not yet implement GET /api/admin/users.
 * When available, this page will show a full user management table.
 */
export default function UsersPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage system users</p>
      </div>
      <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          The backend has not implemented <code>/api/admin/users</code> yet. This page will be activated once the endpoint is available.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="p-0">
          <EmptyState
            icon={Users}
            title="User management coming soon"
            description="GET /api/admin/users has not been implemented in the backend yet."
          />
        </CardContent>
      </Card>
    </div>
  )
}
