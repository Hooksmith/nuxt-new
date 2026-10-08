import { z } from 'zod'
import { emailField } from './common'

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, 'Enter your password')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
})
export type LoginInput = z.infer<typeof loginSchema>

export interface User {
  id: string
  name: string
  email: string
  segment: 'retail' | 'premier'
  customerSince: string
}
