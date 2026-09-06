'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Coffee, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useRounds } from '@/hooks/useRounds'
import { useCreateOrder } from '@/hooks/useOrders'
import { getBeverages } from '@/api/beverages'
import { getErrorMessage, formatTime } from '@/lib/utils'
import { getStoredUser } from '@/lib/auth'
import { Beverage } from '@/types/beverage'
import { OrderResponse } from '@/types/order'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RoundStatusBadge } from '@/components/dashboard/RoundStatusBadge'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { EmptyState } from '@/components/dashboard/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function OrderPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { rounds, isLoading: roundsLoading, error: roundsError, refetch: refetchRounds } = useRounds()

  const [beverages, setBeverages] = useState<Beverage[]>([])
  const [bevsLoading, setBevsLoading] = useState(true)
  const [bevsError, setBevsError] = useState<string | null>(null)

  const [selectedBeverage, setSelectedBeverage] = useState<Beverage | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null)

  const { submitOrder, isSubmitting } = useCreateOrder()

  // Fetch beverages
  useEffect(() => {
    setBevsLoading(true)
    getBeverages()
      .then(setBeverages)
      .catch((err) => setBevsError(getErrorMessage(err)))
      .finally(() => setBevsLoading(false))
  }, [])

  const openRound = rounds.find((r) => r.status === 'OPEN')

  const handleSelectBeverage = (bev: Beverage) => {
    if (!openRound) {
      toast.error('No round is currently open for orders.')
      return
    }
    setSelectedBeverage(bev)
    setConfirmOpen(true)
  }

  const handleConfirmOrder = async () => {
    if (!openRound || !selectedBeverage) return

    const storedUser = getStoredUser()
    // const employeeId = storedUser?.employeeId
    // console.log('employeeId: ', employeeId);

    // if (!employeeId) {
    //   toast.error('Unable to determine your employee ID. Please log out and back in.')
    //   return
    // }

    try {
      const result = await submitOrder({
        roundId: openRound.id,
        beverageId: selectedBeverage.id,
        
      })
      setConfirmOpen(false)
      setOrderResult(result)
      toast.success('Order placed successfully!')
    } catch (err) {
      const msg = getErrorMessage(err)
      setConfirmOpen(false)
      if (msg.toLowerCase().includes('already')) {
        toast.error('Already registered for this round.')
      } else {
        toast.error(msg)
      }
    }
  }

  // Success screen
  if (orderResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 max-w-md mx-auto text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Order Confirmed!</h2>
          <p className="text-muted-foreground">Your beverage has been registered successfully.</p>
        </div>
        <Card className="w-full text-left">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Round</span>
              <span className="font-medium">{orderResult.roundName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Beverage</span>
              <span className="font-medium">{orderResult.beverageName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">#{orderResult.orderId}</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard/my-orders">View My Orders</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isLoading = roundsLoading || bevsLoading

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Choose Your Beverage</h2>
          <p className="text-sm text-muted-foreground">Select a drink for the current round</p>
        </div>
      </div>

      {/* Round status banner */}
      {!roundsLoading && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          openRound
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10'
            : 'border-border bg-muted/50'
        }`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            openRound ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
          }`}>
            <Coffee className={`h-5 w-5 ${openRound ? 'text-emerald-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            {openRound ? (
              <>
                <p className="font-medium text-emerald-800 dark:text-emerald-300">
                  {openRound.name} Round is Open
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Accepting orders until {formatTime(openRound.cutoffTime)}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">No round is currently open</p>
                <p className="text-xs text-muted-foreground">Come back when the next round opens</p>
              </>
            )}
          </div>
          {openRound && <RoundStatusBadge status="OPEN" />}
        </div>
      )}

      {/* Beverage grid */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bevsError ? (
        <ErrorState message={bevsError} onRetry={() => window.location.reload()} />
      ) : beverages.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="No beverages available"
          description="No beverages are currently configured. Contact your administrator."
        />
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {beverages.filter((b) => b.active).map((bev) => (
            <Card
              key={bev.id}
              className={`group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
                !openRound ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              onClick={() => handleSelectBeverage(bev)}
            >
              <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-3xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                  {bev.icon || '☕'}
                </div>
                <p className="font-semibold text-foreground">{bev.name}</p>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!openRound}
                  onClick={(e) => { e.stopPropagation(); handleSelectBeverage(bev) }}
                >
                  Select
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
            <DialogDescription>
              You can only register once per round. Please confirm your selection.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Round</span>
              <span className="font-medium">{openRound?.name} Round</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Beverage</span>
              <span className="font-medium flex items-center gap-1.5">
                {selectedBeverage?.icon} {selectedBeverage?.name}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            You can only register once per round. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
              ) : (
                'Confirm Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
