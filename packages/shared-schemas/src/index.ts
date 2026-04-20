import { z } from "zod"

// Canonical schemas per domain concept. Infer TS types with z.infer<typeof schema>.
//
// Example:
//   export const profileSchema = z.object({
//     id: z.string().uuid(),
//     email: z.string().email(),
//     full_name: z.string().min(1),
//   })
//   export type Profile = z.infer<typeof profileSchema>

export const emailSchema = z.string().email()
export const uuidSchema = z.string().uuid()
