import { UserRole, UserStatus } from '@/common/constants/auth.constant'
import z from 'zod'

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  totpEnabled: z.boolean(),
  role: z.enum([UserRole.LEARNER, UserRole.TEACHER, UserRole.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
})

export type UserProfileType = z.infer<typeof UserProfileSchema>
