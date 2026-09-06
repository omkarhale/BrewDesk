'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { webPunch, getMyProfile, getMonthAttendance } from '@/api/attendance'

// ── Query keys ────────────────────────────────────────────────────────────────

export const punchKeys = {
  myProfile: ['attendance', 'my-profile'] as const,
  myMonth:   (year: number, month: number) =>
    ['attendance', 'my-month', year, month] as const,
}

// ── My employee profile ───────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: punchKeys.myProfile,
    queryFn: getMyProfile,
    retry: false, // don't spam if no profile linked
  })
}

// ── My monthly attendance ─────────────────────────────────────────────────────

export function useMyMonthAttendance(year: number, month: number, employeeCode: string | undefined) {
  return useQuery({
    queryKey: punchKeys.myMonth(year, month),
    queryFn: () => getMonthAttendance(employeeCode!, year, month),
    enabled: !!employeeCode,
  })
}

// ── Web punch mutation ────────────────────────────────────────────────────────

export function useWebPunch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: webPunch,
    onSuccess: (data) => {
      toast.success(data.message)
      // Invalidate current month so the timeline refreshes
      queryClient.invalidateQueries({ queryKey: ['attendance', 'my-month'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const msg = err.response?.data?.message || err.message || 'Failed to record punch'
      toast.error(msg)
    },
  })
}
