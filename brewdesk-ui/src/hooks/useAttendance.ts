'use client'

import { useCallback, useState } from 'react'
import { calculateAttendance } from '@/api/attendance'
import { AttendanceCalculationResponse } from '@/types/attendance'
import { getErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

export function useAttendanceCalculation() {
  const [attendance, setAttendance] = useState<AttendanceCalculationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (employeeCode: string, attendanceDate: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await calculateAttendance(employeeCode, attendanceDate)
      setAttendance(data)
      toast.success('Attendance calculated successfully')
      return data
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setAttendance(null)
    setError(null)
  }, [])

  return { attendance, isLoading, error, calculate, reset }
}
