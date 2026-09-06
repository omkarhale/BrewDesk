'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTodayRounds, getRoundSummary, getAdminRounds } from '@/api/rounds'
import { Round, RoundSummaryResponse } from '@/types/round'
import { getErrorMessage } from '@/lib/utils'

export function useRounds(isAdmin: boolean = false) {
  const [rounds, setRounds] = useState<Round[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRounds = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = isAdmin ? await getAdminRounds() : await getTodayRounds()
      setRounds(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchRounds()
  }, [fetchRounds])

  return { rounds, isLoading, error, refetch: fetchRounds }
}

export function useRoundSummary(roundId: number | null) {
  const [summary, setSummary] = useState<RoundSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    if (!roundId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getRoundSummary(roundId)
      setSummary(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [roundId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, isLoading, error, refetch: fetchSummary }
}
