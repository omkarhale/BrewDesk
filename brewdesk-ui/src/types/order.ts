export interface OrderRequest {
  roundId: number
  beverageId: number
  // employeeId: number
}

export interface OrderResponse {
  orderId: number
  employeeName: string
  beverageName: string
  roundName: string
  createdAt: string   // ISO datetime string "2025-07-14T16:05:00"
}
