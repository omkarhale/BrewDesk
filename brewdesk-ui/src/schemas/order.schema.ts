import { z } from 'zod'

export const orderSchema = z.object({
  roundId: z
    .number({ invalid_type_error: 'Round ID must be a number' })
    .int('Round ID must be a whole number')
    .positive('Round ID must be a positive number'),
  beverageId: z
    .number({ invalid_type_error: 'Beverage ID must be a number' })
    .int('Beverage ID must be a whole number')
    .positive('Beverage ID must be a positive number'),
  employeeId: z
    .number({ invalid_type_error: 'Employee ID must be a number' })
    .int('Employee ID must be a whole number')
    .positive('Employee ID must be a positive number'),
})

export type OrderFormValues = z.infer<typeof orderSchema>
