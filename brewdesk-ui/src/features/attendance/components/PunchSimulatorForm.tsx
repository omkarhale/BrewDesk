'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Zap } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { simulatePunchSchema, SimulatePunchFormValues } from '@/schemas/attendance.schema'
import { Employee } from '@/types/attendance'

const SOURCES = [
  { value: 'FACE', label: 'Face Recognition' },
  { value: 'FINGERPRINT', label: 'Fingerprint' },
  { value: 'RFID_CARD', label: 'RFID Card' },
  { value: 'WEB', label: 'Web' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'API', label: 'API' },
] as const

interface PunchSimulatorFormProps {
  employees: Employee[]
  isSubmitting: boolean
  onSubmit: (values: SimulatePunchFormValues) => Promise<void>
}

function generateEventId(): string {
  return `SIM-${Date.now()}`
}

export function PunchSimulatorForm({
  employees,
  isSubmitting,
  onSubmit,
}: PunchSimulatorFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SimulatePunchFormValues>({
    resolver: zodResolver(simulatePunchSchema),
    defaultValues: {
      employeeCode: '',
      eventDate: today,
      eventTime: nowTime,
      source: 'WEB',
      eventType: 'PUNCH',
      externalEventId: generateEventId(),
    },
  })

  // Refresh the generated ID whenever date or time changes so each punch is unique
  const eventDate = watch('eventDate')
  const eventTime = watch('eventTime')
  useEffect(() => {
    setValue('externalEventId', generateEventId())
  }, [eventDate, eventTime, setValue])

  const handleFormSubmit = async (values: SimulatePunchFormValues) => {
    await onSubmit(values)
    // After success, bump the event ID so the next punch is immediately ready
    setValue('externalEventId', generateEventId())
  }

  const handleReset = () => {
    reset({
      employeeCode: '',
      eventDate: today,
      eventTime: new Date().toTimeString().slice(0, 5),
      source: 'WEB',
      eventType: 'PUNCH',
      externalEventId: generateEventId(),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Employee Code */}
      <div className="space-y-1.5">
        <Label htmlFor="sim-employee">
          Employee Code <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="employeeCode"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="sim-employee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    No employees found
                  </SelectItem>
                ) : (
                  employees.map((e) => (
                    <SelectItem key={e.id} value={e.employeeCode}>
                      <span className="font-mono">{e.employeeCode}</span>
                      {e.designation && (
                        <span className="ml-2 text-muted-foreground text-xs">
                          — {e.designation}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.employeeCode && (
          <p className="text-xs text-destructive" role="alert">
            {errors.employeeCode.message}
          </p>
        )}
      </div>

      {/* Date + Time row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sim-date">
            Date <span className="text-destructive">*</span>
          </Label>
          <Input id="sim-date" type="date" {...register('eventDate')} />
          {errors.eventDate && (
            <p className="text-xs text-destructive" role="alert">
              {errors.eventDate.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-time">
            Time <span className="text-destructive">*</span>
          </Label>
          <Input id="sim-time" type="time" {...register('eventTime')} />
          {errors.eventTime && (
            <p className="text-xs text-destructive" role="alert">
              {errors.eventTime.message}
            </p>
          )}
        </div>
      </div>

      {/* Source + Event Type row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sim-source">
            Source <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="sim-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.source && (
            <p className="text-xs text-destructive" role="alert">
              {errors.source.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-type">Event Type</Label>
          <Input
            id="sim-type"
            value="PUNCH"
            readOnly
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        </div>
      </div>

      {/* External Event ID */}
      <div className="space-y-1.5">
        <Label htmlFor="sim-extid">
          External Event ID <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sim-extid"
          autoComplete="off"
          {...register('externalEventId')}
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated. Override to replay a specific event or test idempotency.
        </p>
        {errors.externalEventId && (
          <p className="text-xs text-destructive" role="alert">
            {errors.externalEventId.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending Punch...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Send Punch
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          Reset
        </Button>
      </div>
    </form>
  )
}
