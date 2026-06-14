import { OnboardingBodySchema, OnboardingResSchema, UserProfileSchema } from './profile.schema'
import { createZodDto } from 'nestjs-zod'

export class GetUserProfileResDTO extends createZodDto(UserProfileSchema) {}

export class OnboardingBodyDTO extends createZodDto(OnboardingBodySchema) {}

export class OnboardingResDTO extends createZodDto(OnboardingResSchema) {}
