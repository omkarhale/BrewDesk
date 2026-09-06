'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Moon } from 'lucide-react'
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
import { createShiftSchema, CreateShiftFormValues } from '@/schemas/attendance.schema'
import { useCreateShift } from '@/hooks/useShiftManagement'
import { isOvernightShift } from '@/lib/utils'

interface ShiftFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DEFAULT_VALUES: CreateShiftFormValues = {
  name: '',
  startTime: '',
  endTime: '',
  breakMinutes: 0,
  graceMinutes: 0,
  minimumWorkMinutes: 480,
  halfDayMinutes: 240,
}

function MinutesInput({
  id,
  label,
  hint,
  registration,
  error,
}: {
  id: string
  label: string
  hint?: string
  registration: ReturnType<ReturnType<typeof useForm<CreateShiftFormValues>>['register']>
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        autoComplete="off"
        {...registration}
        onChange={(e) => {
          const raw = e.target.value
          registration.onChange({
            target: { value: raw === '' ? '' : Number(raw) },
          } as React.ChangeEvent<HTMLInputElement>)
        }}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function ShiftFormDialog({ open, onOpenChange, onSuccess }: ShiftFormDialogProps) {
  const createShiftMutation = useCreateShift()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateShiftFormValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES)
  }, [open, reset])

  const startTime = watch('startTime')
  const endTime = watch('endTime')
  const overnight =
    startTime && endTime && /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime)
      ? isOvernightShift(startTime + ':00', endTime + ':00')
      : false

  const onSubmit = async (values: CreateShiftFormValues) => {
    try {
      await createShiftMutation.mutateAsync({
        name: values.name.trim(),
        startTime: values.startTime + ':00', // backend expects HH:mm:ss / LocalTime
        endTime: values.endTime + ':00',
        breakMinutes: values.breakMinutes,
        graceMinutes: values.graceMinutes,
        minimumWorkMinutes: values.minimumWorkMinutes,
        halfDayMinutes: values.halfDayMinutes,
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      // Error toast handled in mutation onError
    }
  }

  const isSubmitting = createShiftMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Shift</DialogTitle>
          <DialogDescription>
            Define shift hours, grace period, and minimum work requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="shift-name">Shift Name</Label>
            <Input
              id="shift-name"
              placeholder="e.g., Day Shift, Night Shift"
              autoComplete="off"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>
            )}
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="shift-start">Start Time</Label>
              <Input
                id="shift-start"
                type="time"
                {...register('startTime')}
              />
              {errors.startTime && (
                <p className="text-xs text-destructive" role="alert">{errors.startTime.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-end">End Time</Label>
              <Input
                id="shift-end"
                type="time"
                {...register('endTime')}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive" role="alert">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Overnight indicator */}
          {overnight && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <Moon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Overnight shift detected — end time is on the next calendar day.
              </p>
            </div>
          )}

          {/* Minutes grid */}
          <div className="grid grid-cols-2 gap-4">
            <MinutesInput
              id="shift-grace"
              label="Grace Minutes"
              hint="Late arrival tolerance"
              registration={register('graceMinutes', { valueAsNumber: true })}
              error={errors.graceMinutes?.message}
            />
            <MinutesInput
              id="shift-break"
              label="Break Minutes"
              hint="Reference only — not auto-deducted"
              registration={register('breakMinutes', { valueAsNumber: true })}
              error={errors.breakMinutes?.message}
            />
            <MinutesInput
              id="shift-minwork"
              label="Minimum Work Minutes"
              hint="Required for PRESENT status"
              registration={register('minimumWorkMinutes', { valueAsNumber: true })}
              error={errors.minimumWorkMinutes?.message}
            />
            <MinutesInput
              id="shift-halfday"
              label="Half Day Minutes"
              hint="Threshold for HALF_DAY status"
              registration={register('halfDayMinutes', { valueAsNumber: true })}
              error={errors.halfDayMinutes?.message}
            />
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
                  Adding...
                </>
              ) : (
                'Add Shift'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
