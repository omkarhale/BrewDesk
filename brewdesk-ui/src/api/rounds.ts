import apiClient from '@/lib/api'
import { Round, RoundSummaryResponse, CreateRoundRequest, UpdateRoundRequest } from '@/types/round'

/** GET /api/rounds/today — returns today's rounds with live status */
export async function getTodayRounds(): Promise<Round[]> {
  const response = await apiClient.get<Round[]>('/api/rounds/today')
  return response.data
}

/** GET /api/admin/rounds — returns today's rounds for admin */
export async function getAdminRounds(): Promise<Round[]> {
  const response = await apiClient.get<Round[]>('/api/admin/rounds')
  return response.data
}

/** POST /api/admin/rounds — create a new round */
export async function createRound(data: CreateRoundRequest): Promise<Round> {
  const response = await apiClient.post<Round>('/api/admin/rounds', data)
  return response.data
}

/** PUT /api/admin/rounds/{id} — update an existing round */
export async function updateRound(id: number, data: UpdateRoundRequest): Promise<Round> {
  const response = await apiClient.put<Round>(`/api/admin/rounds/${id}`, data)
  return response.data
}

/** GET /api/rounds/{roundId}/summary — beverage counts for a round */
export async function getRoundSummary(roundId: number): Promise<RoundSummaryResponse> {
  const response = await apiClient.get<RoundSummaryResponse>(`/api/rounds/${roundId}/summary`)
  return response.data
}
