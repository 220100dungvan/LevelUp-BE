import { UserRole, UserStatus } from '@/common/constants/auth.constant'
import { ClassRole } from '@/common/constants/class.constant'
import { z } from 'zod'

// Shared user shape (safe, no password)
export const SafeUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.enum([UserRole.LEARNER, UserRole.TEACHER, UserRole.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]),
  totpEnabled: z.boolean(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
})

// GET /users (admin list)
export const GetUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(), // search by email or fullName
    role: z.enum([UserRole.LEARNER, UserRole.TEACHER, UserRole.ADMIN]).optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]).optional(),
  })
  .strict()

export const GetUsersResSchema = z.object({
  data: z.array(SafeUserSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
})

// GET /users/:id
// Class summary shape embedded in user detail
export const UserClassSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  inviteCode: z.string(),
  role: z.enum([ClassRole.STUDENT, ClassRole.ASSISTANT]),
  joinedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
  teacher: z.object({
    id: z.string().uuid(),
    fullName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    email: z.string().email(),
  }),
  totalMembers: z.number().int(),
  createdAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
})

export const GetUserResSchema = SafeUserSchema.extend({
  classes: z.array(UserClassSummarySchema),
})

// PATCH /users/:id
export const UpdateUserBodySchema = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    phoneNumber: z.string().nullable().optional(),
    role: z.enum([UserRole.LEARNER, UserRole.TEACHER, UserRole.ADMIN]).optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const UpdateUserResSchema = SafeUserSchema

export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>
export type GetUsersResType = z.infer<typeof GetUsersResSchema>
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>
export type SafeUserType = z.infer<typeof SafeUserSchema>
