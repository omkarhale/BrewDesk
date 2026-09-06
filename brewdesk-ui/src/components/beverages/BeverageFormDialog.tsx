'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import EmojiPicker from 'emoji-picker-react'
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
import { Switch } from '@/components/ui/switch'
import { Beverage, CreateBeverageRequest, UpdateBeverageRequest } from '@/types/beverage'
import { createBeverage, updateBeverage } from '@/api/beverages'

const beverageFormSchema = z.object({
  name: z.string().min(1, 'Beverage name is required'),
  icon: z.string().min(1, 'Please select an emoji'),
  active: z.boolean(),
})

type BeverageFormValues = z.infer<typeof beverageFormSchema>

interface BeverageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  beverage?: Beverage
  onSuccess: () => void
}

export function BeverageFormDialog({
  open,
  onOpenChange,
  mode,
  beverage,
  onSuccess,
}: BeverageFormDialogProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<BeverageFormValues>({
    resolver: zodResolver(beverageFormSchema),
    defaultValues: {
      name: '',
      icon: '☕',
      active: true,
    },
  })

  const selectedIcon = watch('icon')

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && beverage) {
      reset({
        name: beverage.name,
        icon: beverage.icon,
        active: beverage.active,
      })
    } else if (mode === 'create') {
      reset({
        name: '',
        icon: '☕',
        active: true,
      })
    }
  }, [mode, beverage, reset, open])

  const handleEmojiSelect = (emoji: any) => {
    setValue('icon', emoji.emoji)
    setShowEmojiPicker(false)
  }

  const onSubmit = async (values: BeverageFormValues) => {
    try {
      if (mode === 'create') {
        const request: CreateBeverageRequest = {
          name: values.name,
          icon: values.icon,
        }
        await createBeverage(request)
        toast.success('Beverage created successfully')
      } else if (mode === 'edit' && beverage) {
        const request: UpdateBeverageRequest = {
          name: values.name,
          icon: values.icon,
          active: values.active,
        }
        await updateBeverage(beverage.id, request)
        toast.success('Beverage updated successfully')
      }
      
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to save beverage'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Beverage' : 'Edit Beverage'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new beverage to the system.'
              : 'Update the beverage details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Beverage Name</Label>
            <Input
              id="name"
              placeholder="e.g., Green Tea, Coffee, Juice"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Beverage Icon</Label>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-5xl">
                {selectedIcon || '☕'}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {showEmojiPicker ? 'Close Picker' : 'Choose Emoji'}
              </Button>
            </div>
            {showEmojiPicker && (
              <div className="mt-2">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            )}
            {errors.icon && (
              <p className="text-xs text-destructive">{errors.icon.message}</p>
            )}
          </div>

          {mode === 'edit' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Status</Label>
              <Switch
                id="active"
                checked={watch('active')}
                onCheckedChange={(checked: boolean) => setValue('active', checked)}
              />
            </div>
          )}

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
                  {mode === 'create' ? 'Adding...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Add Beverage' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
