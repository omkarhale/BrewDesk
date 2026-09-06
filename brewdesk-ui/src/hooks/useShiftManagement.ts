'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createShift, getShifts } from '@/api/attendance'
import { CreateShiftRequest } from '@/types/attendance'

export const shiftKeys = {
  all: ['attendance', 'shifts'] as const,
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    return err.response?.data?.message || err.message || fallback
  }
  return fallback
}

export function useShiftsQuery() {
  return useQuery({
    queryKey: shiftKeys.all,
    queryFn: getShifts,
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateShiftRequest) => createShift(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all })
      toast.success('Shift created successfully')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to create shift'))
    },
  })
}
