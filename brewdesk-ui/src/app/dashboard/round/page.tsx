'use client'

import { useState } from 'react'
import { Clock, RefreshCw, Plus, MoreVertical } from 'lucide-react'
import { useRounds } from '@/hooks/useRounds'
import { useAuth } from '@/hooks/useAuth'
import { formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RoundStatusBadge } from '@/components/dashboard/RoundStatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { RoundFormDialog } from '@/components/rounds/RoundFormDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Round } from '@/types/round'

export default function RoundPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { rounds, isLoading, error, refetch } = useRounds(isAdmin)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedRound, setSelectedRound] = useState<Round | undefined>(undefined)

  const handleCreateRound = () => {
    setDialogMode('create')
    setSelectedRound(undefined)
    setDialogOpen(true)
  }

  const handleEditRound = (round: Round) => {
    setDialogMode('edit')
    setSelectedRound(round)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    refetch()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Today&apos;s Rounds</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Live status updates every refresh</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" onClick={handleCreateRound}>
              <Plus className="h-4 w-4 mr-2" />
              Create Round
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-48" />
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
          icon={Clock}
          title="No rounds today"
          description="No beverage rounds have been scheduled for today. Check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rounds.map((round) => (
            <Card
              key={round.id}
              className={`relative overflow-hidden hover:shadow-md transition-all duration-200 ${
                round.status === 'OPEN'
                  ? 'border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-800'
                  : ''
              }`}
            >
              {round.status === 'OPEN' && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{round.name} Round</CardTitle>
                  <div className="flex items-center gap-2">
                    <RoundStatusBadge status={round.status} />
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRound(round)}>
                            Edit Round
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opens</p>
                    <p className="font-medium">{formatTime(round.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Closes</p>
                    <p className="font-medium">{formatTime(round.cutoffTime)}</p>
                  </div>
                </div>

                <div className="pt-1 space-y-1.5 text-xs text-muted-foreground">
                  {round.status === 'UPCOMING' && (
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
                      Opens at {formatTime(round.startTime)}
                    </p>
                  )}
                  {round.status === 'OPEN' && (
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Accepting orders until {formatTime(round.cutoffTime)}
                    </p>
                  )}
                  {round.status === 'CLOSED' && (
                    <p className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
                      This round has ended
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoundFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        round={selectedRound}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
