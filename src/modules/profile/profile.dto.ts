import { OnboardingBodySchema, OnboardingResSchema, UpdateLevelBodySchema, UserProfileSchema } from './profile.schema'
import { createZodDto } from 'nestjs-zod'

export class GetUserProfileResDTO extends createZodDto(UserProfileSchema) {}

export class OnboardingBodyDTO extends createZodDto(OnboardingBodySchema) {}

export class OnboardingResDTO extends createZodDto(OnboardingResSchema) {}

export class UpdateLevelBodyDTO extends createZodDto(UpdateLevelBodySchema) {}
