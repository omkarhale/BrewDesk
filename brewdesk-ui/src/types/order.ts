export interface OrderRequest {
  roundId: number
  beverageId: number
  // employeeId: number
}

export interface OrderResponse {
  orderId: number
  employeeId?: number
  employeeName: string
  beverageId?: number
  beverageName: string
  beverageIcon?: string
  roundId?: number
  roundName: string
  roundStatus?: string
  createdAt: string   // ISO datetime string
}
