'use client'

import { useState, useEffect, useMemo } from 'react'
import { Coffee, Plus, MoreVertical, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { getBeverages, getAdminBeverages, deleteBeverage } from '@/api/beverages'
import { Beverage } from '@/types/beverage'
import { getErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorState } from '@/components/dashboard/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BeverageFormDialog } from '@/components/beverages/BeverageFormDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function BeveragesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [beverages, setBeverages] = useState<Beverage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedBeverage, setSelectedBeverage] = useState<Beverage | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [beverageToDelete, setBeverageToDelete] = useState<Beverage | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const fetchBeverages = isAdmin ? getAdminBeverages : getBeverages
    fetchBeverages()
      .then(setBeverages)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [isAdmin])

  const filteredBeverages = useMemo(() => {
    return beverages.filter((bev) => {
      const matchesSearch = bev.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && bev.active) ||
        (statusFilter === 'inactive' && !bev.active)
      return matchesSearch && matchesStatus
    })
  }, [beverages, searchQuery, statusFilter])

  const handleCreateBeverage = () => {
    setDialogMode('create')
    setSelectedBeverage(undefined)
    setDialogOpen(true)
  }

  const handleEditBeverage = (beverage: Beverage) => {
    setDialogMode('edit')
    setSelectedBeverage(beverage)
    setDialogOpen(true)
  }

  const handleDeleteBeverage = (beverage: Beverage) => {
    setBeverageToDelete(beverage)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!beverageToDelete) return
    setIsDeleting(true)
    try {
      await deleteBeverage(beverageToDelete.id)
      toast.success('Beverage deleted successfully')
      setDeleteDialogOpen(false)
      setBeverageToDelete(undefined)
      // Refresh beverages
      const fetchBeverages = isAdmin ? getAdminBeverages : getBeverages
      const updated = await fetchBeverages()
      setBeverages(updated)
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete beverage'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDialogSuccess = () => {
    // Refresh beverages
    const fetchBeverages = isAdmin ? getAdminBeverages : getBeverages
    fetchBeverages()
      .then(setBeverages)
      .catch((err) => setError(getErrorMessage(err)))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Beverages</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Available beverages in the system</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={handleCreateBeverage}>
            <Plus className="h-4 w-4 mr-2" />
            Add Beverage
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredBeverages.length === 0 ? (
        <EmptyState icon={Coffee} title="No beverages" description="No beverages are configured." />
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBeverages.map((bev) => (
            <Card key={bev.id} className="hover:shadow-md transition-shadow relative">
              <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-3xl">
                  {bev.icon || '☕'}
                </div>
                <p className="font-semibold">{bev.name}</p>
                <Badge variant={bev.active ? 'success' : 'secondary'}>
                  {bev.active ? 'Active' : 'Inactive'}
                </Badge>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditBeverage(bev)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteBeverage(bev)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BeverageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        beverage={selectedBeverage}
        onSuccess={handleDialogSuccess}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Beverage?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{beverageToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
