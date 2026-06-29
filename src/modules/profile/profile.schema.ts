import { UserRole, UserStatus } from '@/common/constants/auth.constant'
import { GENDER } from '@/common/constants/gender.constant'
import { Level } from '@/common/constants/vocabulary.constant'
import z from 'zod'

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  totpEnabled: z.boolean(),
  gender: z.enum([GENDER.MALE, GENDER.FEMALE, GENDER.OTHER]).nullable(),
  dateOfBirth: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  level: z
    .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
    .nullable(),
  isOnboarded: z.boolean(),
  role: z.enum([UserRole.LEARNER, UserRole.TEACHER, UserRole.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
})

export const OnboardingBodySchema = z
  .object({
    gender: z.enum([GENDER.MALE, GENDER.FEMALE, GENDER.OTHER]),
    dateOfBirth: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
    level: z.enum([
      Level.Beginner,
      Level.Elementary,
      Level.Intermediate,
      Level.Upper_Inter,
      Level.Advanced,
      Level.Mastery,
    ]),
  })
  .strict()

export const OnboardingResSchema = UserProfileSchema

export type UserProfileType = z.infer<typeof UserProfileSchema>

export type OnboardingBodyType = z.infer<typeof OnboardingBodySchema>
export type OnboardingResType = z.infer<typeof OnboardingResSchema>
