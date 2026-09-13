'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useUpdateEmployee } from '@/hooks/useEmployeeManagement'
import { Department, Employee, Shift } from '@/types/attendance'
import { UserResponse } from '@/types/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  shiftId:      z.string().optional(),
  departmentId: z.string().optional(),
  designation:  z.string().trim().max(100).optional().or(z.literal('')),
  managerId:    z.string().optional(),
  joiningDate:  z.string().min(1, 'Joining date is required').regex(/^\d{4}-\d{2}-\d{2}$/),
  active:       z.boolean(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  employee: Employee
  shifts: Shift[]
  departments: Department[]
  users: UserResponse[]        // all users — for manager dropdown
  onSuccess: () => void
}

export function EditEmployeeDialog({
  open, onOpenChange, employee, shifts, departments, users, onSuccess,
}: Props) {
  const mutation = useUpdateEmployee()

  const { register, handleSubmit, formState: { errors }, reset, control } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: getDefaults(employee),
    })

  useEffect(() => {
    if (open) reset(getDefaults(employee))
  }, [open, employee, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync({
        id: employee.id,
        request: {
          shiftId:      values.shiftId      && values.shiftId      !== '__none' ? Number(values.shiftId)      : null,
          departmentId: values.departmentId && values.departmentId !== '__none' ? Number(values.departmentId) : null,
          designation:  values.designation  || undefined,
          managerId:    values.managerId    && values.managerId    !== '__none' ? Number(values.managerId)    : null,
          joiningDate:  values.joiningDate,
          active:       values.active,
        },
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      // error toast handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update profile for{' '}
            <span className="font-mono font-semibold">{employee.employeeCode}</span>
            {employee.userName && (
              <span className="text-muted-foreground"> — {employee.userName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Designation */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desig">Designation</Label>
            <Input
              id="edit-desig"
              placeholder="e.g., Software Engineer"
              autoComplete="off"
              {...register('designation')}
            />
            {errors.designation && (
              <p className="text-xs text-destructive">{errors.designation.message}</p>
            )}
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <Label>Shift</Label>
            <Controller
              name="shiftId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="No shift" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No shift</SelectItem>
                    {shifts.filter(s => s.active).map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No department</SelectItem>
                    {departments.filter(d => d.active).map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Manager */}
          <div className="space-y-1.5">
            <Label>Reporting Manager</Label>
            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="No manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No manager</SelectItem>
                    {users
                      .filter(u => u.id !== employee.userId) // can't report to themselves
                      .map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                          <span className="ml-1.5 text-muted-foreground text-xs">({u.role})</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Assigns the reporting manager for attendance approvals.
            </p>
          </div>

          {/* Joining Date */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-join">Joining Date</Label>
            <Input id="edit-join" type="date" {...register('joiningDate')} />
            {errors.joiningDate && (
              <p className="text-xs text-destructive">{errors.joiningDate.message}</p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive employees cannot punch in
              </p>
            </div>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button" variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getDefaults(employee: Employee): FormValues {
  return {
    shiftId:      employee.shiftId      ? String(employee.shiftId)      : '__none',
    departmentId: employee.departmentId ? String(employee.departmentId) : '__none',
    designation:  employee.designation  ?? '',
    managerId:    employee.managerId    ? String(employee.managerId)    : '__none',
    joiningDate:  employee.joiningDate,
    active:       employee.active,
  }
}
