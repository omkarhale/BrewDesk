import { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrder, getMyOrders, getAllOrders, cancelOrder } from '@/api/orders'
import { OrderRequest, OrderResponse } from '@/types/order'
import { getErrorMessage } from '@/lib/utils'

export function useCreateOrder() {
  const queryClient = useQueryClient()
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
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      return response
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }, [queryClient])

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  return { submitOrder, isSubmitting, error, result, reset }
}

export function useMyOrders() {
  const queryClient = useQueryClient()

  const query = useQuery<OrderResponse[]>({
    queryKey: ['orders', 'my'],
    queryFn: getMyOrders,
    refetchInterval: 30000,
  })

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
    cancelOrder: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  }
}

export function useAllOrders(roundId?: number) {
  const query = useQuery<OrderResponse[]>({
    queryKey: ['orders', 'all', roundId],
    queryFn: () => getAllOrders(roundId),
    refetchInterval: 15000,
  })

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}
