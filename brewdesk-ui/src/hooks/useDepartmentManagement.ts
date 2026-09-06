'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createDepartment, getDepartments } from '@/api/attendance'
import { CreateDepartmentRequest } from '@/types/attendance'

export const departmentKeys = {
  all: ['attendance', 'departments'] as const,
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    return err.response?.data?.message || err.message || fallback
  }
  return fallback
}

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: getDepartments,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateDepartmentRequest) => createDepartment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      toast.success('Department created successfully')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to create department'))
    },
  })
}
