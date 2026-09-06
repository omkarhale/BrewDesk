import apiClient from '@/lib/api'
import { Beverage, CreateBeverageRequest, UpdateBeverageRequest } from '@/types/beverage'

/** GET /api/beverages — requires valid JWT */
export async function getBeverages(): Promise<Beverage[]> {
  const response = await apiClient.get<Beverage[]>('/api/beverages')
  return response.data
}

/** GET /api/admin/beverages — admin endpoint for beverages */
export async function getAdminBeverages(): Promise<Beverage[]> {
  const response = await apiClient.get<Beverage[]>('/api/admin/beverages')
  return response.data
}

/** POST /api/admin/beverages — create a new beverage */
export async function createBeverage(data: CreateBeverageRequest): Promise<Beverage> {
  const response = await apiClient.post<Beverage>('/api/admin/beverages', data)
  return response.data
}

/** PUT /api/admin/beverages/{id} — update an existing beverage */
export async function updateBeverage(id: number, data: UpdateBeverageRequest): Promise<Beverage> {
  const response = await apiClient.put<Beverage>(`/api/admin/beverages/${id}`, data)
  return response.data
}

/** DELETE /api/admin/beverages/{id} — delete a beverage */
export async function deleteBeverage(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/beverages/${id}`)
}
