'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { createEmployeeSchema, CreateEmployeeFormValues } from '@/schemas/attendance.schema'
import { useCreateEmployee } from '@/hooks/useEmployeeManagement'
import { Department, Shift } from '@/types/attendance'
import { UserResponse } from '@/types/user'

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  users: UserResponse[]
  departments: Department[]
  shifts: Shift[]
}

const DEFAULT_VALUES: CreateEmployeeFormValues = {
  userId: 0,
  employeeCode: '',
  departmentId: null,
  shiftId: 0,
  designation: '',
  managerId: null,
  joiningDate: '',
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  onSuccess,
  users,
  departments,
  shifts,
}: EmployeeFormDialogProps) {
  const createEmployeeMutation = useCreateEmployee()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES)
  }, [open, reset])

  const onSubmit = async (values: CreateEmployeeFormValues) => {
    try {
      await createEmployeeMutation.mutateAsync({
        userId: values.userId,
        employeeCode: values.employeeCode.trim().toUpperCase(),
        departmentId: values.departmentId ?? undefined,
        shiftId: values.shiftId,
        designation: values.designation?.trim() || undefined,
        managerId: values.managerId ?? undefined,
        joiningDate: values.joiningDate,
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      // Error toast handled in mutation onError
    }
  }

  const isSubmitting = createEmployeeMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Create a new employee profile and assign their shift and department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-user">
              User <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger id="emp-user">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="__empty" disabled>No users available</SelectItem>
                    ) : (
                      users.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                          <span className="ml-1.5 text-muted-foreground text-xs">({u.email})</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.userId && (
              <p className="text-xs text-destructive" role="alert">{errors.userId.message}</p>
            )}
          </div>

          {/* Employee Code */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-code">
              Employee Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emp-code"
              placeholder="e.g., EMP001"
              autoComplete="off"
              className="uppercase"
              {...register('employeeCode')}
            />
            <p className="text-xs text-muted-foreground">Unique identifier. Stored as uppercase.</p>
            {errors.employeeCode && (
              <p className="text-xs text-destructive" role="alert">{errors.employeeCode.message}</p>
            )}
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-shift">
              Shift <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="shiftId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger id="emp-shift">
                    <SelectValue placeholder="Select a shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.length === 0 ? (
                      <SelectItem value="__empty" disabled>No shifts available</SelectItem>
                    ) : (
                      shifts.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.shiftId && (
              <p className="text-xs text-destructive" role="alert">{errors.shiftId.message}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-dept">Department</Label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : 'none'}
                  onValueChange={(val) => field.onChange(val === 'none' ? null : Number(val))}
                >
                  <SelectTrigger id="emp-dept">
                    <SelectValue placeholder="Select a department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.departmentId && (
              <p className="text-xs text-destructive" role="alert">{errors.departmentId.message}</p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-designation">Designation</Label>
            <Input
              id="emp-designation"
              placeholder="e.g., Software Engineer"
              autoComplete="off"
              {...register('designation')}
            />
            {errors.designation && (
              <p className="text-xs text-destructive" role="alert">{errors.designation.message}</p>
            )}
          </div>

          {/* Manager */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-manager">Manager</Label>
            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : 'none'}
                  onValueChange={(val) => field.onChange(val === 'none' ? null : Number(val))}
                >
                  <SelectTrigger id="emp-manager">
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.managerId && (
              <p className="text-xs text-destructive" role="alert">{errors.managerId.message}</p>
            )}
          </div>

          {/* Joining Date */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-joining">
              Joining Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emp-joining"
              type="date"
              {...register('joiningDate')}
            />
            {errors.joiningDate && (
              <p className="text-xs text-destructive" role="alert">{errors.joiningDate.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
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
                'Add Employee'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
