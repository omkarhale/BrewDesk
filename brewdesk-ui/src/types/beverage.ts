export interface Beverage {
  id: number
  name: string
  icon: string
  active: boolean
}

export interface BeverageSummary {
  beverageName: string
  icon: string
  count: number
}

export interface CreateBeverageRequest {
  name: string
  icon: string
}

export interface UpdateBeverageRequest {
  name: string
  icon: string
  active: boolean
}
