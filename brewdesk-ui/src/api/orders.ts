import apiClient from '@/lib/api'
import { OrderRequest, OrderResponse } from '@/types/order'

/**
 * POST /api/orders — ROLE_EMPLOYEE only.
 * Requires { roundId, beverageId, employeeId } — all positive Long values.
 * Returns 201 Created with OrderResponse.
 */
export async function createOrder(data: OrderRequest): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>('/api/orders', data)
  return response.data
}

export async function getMyOrders(): Promise<OrderResponse[]> {
  const response = await apiClient.get<OrderResponse[]>('/api/orders/my')
  return response.data
}

export async function getAllOrders(roundId?: number): Promise<OrderResponse[]> {
  const params = roundId ? { roundId } : {}
  const response = await apiClient.get<OrderResponse[]>('/api/orders', { params })
  return response.data
}

export async function cancelOrder(orderId: number): Promise<void> {
  await apiClient.delete(`/api/orders/${orderId}`)
}
