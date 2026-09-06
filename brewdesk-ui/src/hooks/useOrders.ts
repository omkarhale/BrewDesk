'use client'

import { useCallback, useState } from 'react'
import { createOrder } from '@/api/orders'
import { OrderRequest, OrderResponse } from '@/types/order'
import { getErrorMessage } from '@/lib/utils'

export function useCreateOrder() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OrderResponse | null>(null)

  const submitOrder = useCallback(async (data: OrderRequest) => {
    setIsSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const response = await createOrder(data)
      setResult(response)
      return response
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  return { submitOrder, isSubmitting, error, result, reset }
}
