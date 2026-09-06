import { BeverageSummary } from './beverage'

export type RoundStatus = 'UPCOMING' | 'OPEN' | 'CLOSED'

export interface Round {
  id: number
  date: string        // "2025-07-14"
  name: string        // "Morning" | "Afternoon"
  startTime: string   // "16:00:00"
  cutoffTime: string  // "16:30:00"
  status: RoundStatus
}

export interface RoundSummaryResponse {
  roundId: number
  roundName: string
  totalOrders: number
  beverages: BeverageSummary[]
}

export interface CreateRoundRequest {
  date: string
  name: string
  startTime: string
  cutoffTime: string
}

export interface UpdateRoundRequest {
  name: string
  startTime: string
  cutoffTime: string
}
