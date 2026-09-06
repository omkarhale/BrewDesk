'use client'

import { useCallback, useEffect, useState } from 'react'
import { getDepartments, getEmployees, getShifts } from '@/api/attendance'
import { Department, Employee, Shift } from '@/types/attendance'
import { getErrorMessage } from '@/lib/utils'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getDepartments()
      setDepartments(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  return { departments, isLoading, error, refetch: fetchDepartments }
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  return { employees, isLoading, error, refetch: fetchEmployees }
}

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getShifts()
      setShifts(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  return { shifts, isLoading, error, refetch: fetchShifts }
}
