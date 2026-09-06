'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { createDepartmentSchema, CreateDepartmentFormValues } from '@/schemas/attendance.schema'
import { useCreateDepartment } from '@/hooks/useDepartmentManagement'

interface DepartmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DepartmentFormDialog({ open, onOpenChange, onSuccess }: DepartmentFormDialogProps) {
  const createDepartmentMutation = useCreateDepartment()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({ name: '', code: '' })
    }
  }, [open, reset])

  const onSubmit = async (values: CreateDepartmentFormValues) => {
    try {
      await createDepartmentMutation.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      // Error toast handled in mutation onError
    }
  }

  const isSubmitting = createDepartmentMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Create a new department for employee organization and reporting.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department-name">Department Name</Label>
            <Input
              id="department-name"
              placeholder="e.g., Engineering, Human Resources"
              autoComplete="off"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-code">Department Code</Label>
            <Input
              id="department-code"
              placeholder="e.g., ENG, HR"
              autoComplete="off"
              className="uppercase"
              {...register('code')}
            />
            <p className="text-xs text-muted-foreground">
              Alphanumeric with hyphens or underscores. Stored as uppercase.
            </p>
            {errors.code && (
              <p className="text-xs text-destructive" role="alert">
                {errors.code.message}
              </p>
            )}
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
                'Add Department'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
