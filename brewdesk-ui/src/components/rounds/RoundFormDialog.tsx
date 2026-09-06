'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Round, CreateRoundRequest, UpdateRoundRequest } from '@/types/round'
import { createRound, updateRound } from '@/api/rounds'

const roundFormSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    name: z.string().min(1, 'Round name is required'),
    startTime: z.string().min(1, 'Start time is required'),
    cutoffTime: z.string().min(1, 'Cutoff time is required'),
  })
  .refine((data) => data.startTime < data.cutoffTime, {
    message: 'Start time must be before cutoff time',
    path: ['cutoffTime'],
  })

type RoundFormValues = z.infer<typeof roundFormSchema>

interface RoundFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  round?: Round
  onSuccess: () => void
}

export function RoundFormDialog({
  open,
  onOpenChange,
  mode,
  round,
  onSuccess,
}: RoundFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RoundFormValues>({
    resolver: zodResolver(roundFormSchema),
    defaultValues: {
      date: '',
      name: '',
      startTime: '',
      cutoffTime: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && round) {
      reset({
        date: round.date,
        name: round.name,
        startTime: round.startTime.substring(0, 5), // Remove seconds
        cutoffTime: round.cutoffTime.substring(0, 5), // Remove seconds
      })
    } else if (mode === 'create') {
      reset({
        date: new Date().toISOString().split('T')[0], // Default to today
        name: '',
        startTime: '',
        cutoffTime: '',
      })
    }
  }, [mode, round, reset, open])

  const onSubmit = async (values: RoundFormValues) => {
    try {
      if (mode === 'create') {
        const request: CreateRoundRequest = {
          date: values.date,
          name: values.name,
          startTime: values.startTime + ':00',
          cutoffTime: values.cutoffTime + ':00',
        }
        await createRound(request)
        toast.success('Round created successfully')
      } else if (mode === 'edit' && round) {
        const request: UpdateRoundRequest = {
          name: values.name,
          startTime: values.startTime + ':00',
          cutoffTime: values.cutoffTime + ':00',
        }
        await updateRound(round.id, request)
        toast.success('Round updated successfully')
      }
      
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to save round'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Round' : 'Edit Round'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new beverage round for today.'
              : 'Update the round details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              disabled={mode === 'edit'}
              {...register('date')}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Round Name</Label>
            <Input
              id="name"
              placeholder="e.g., Morning, Afternoon, Evening"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
              />
              {errors.startTime && (
                <p className="text-xs text-destructive">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cutoffTime">Cutoff Time</Label>
              <Input
                id="cutoffTime"
                type="time"
                {...register('cutoffTime')}
              />
              {errors.cutoffTime && (
                <p className="text-xs text-destructive">{errors.cutoffTime.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create Round' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
