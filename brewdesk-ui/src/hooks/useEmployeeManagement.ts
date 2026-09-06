'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createEmployee, getEmployees, updateEmployeeShift } from '@/api/attendance'
import { CreateEmployeeRequest } from '@/types/attendance'

export const employeeKeys = {
  all: ['attendance', 'employees'] as const,
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    return err.response?.data?.message || err.message || fallback
  }
  return fallback
}

export function useEmployeesQuery() {
  return useQuery({
    queryKey: employeeKeys.all,
    queryFn: getEmployees,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateEmployeeRequest) => createEmployee(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success('Employee created successfully')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to create employee'))
    },
  })
}

export function useUpdateEmployeeShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, shiftId }: { employeeId: number; shiftId: number }) =>
      updateEmployeeShift(employeeId, shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      toast.success('Employee shift updated successfully')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to update employee shift'))
    },
  })
}
