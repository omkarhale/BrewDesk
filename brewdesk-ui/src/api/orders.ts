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
