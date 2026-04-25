import { UserProfileSchema } from './profile.schema'
import { createZodDto } from 'nestjs-zod'

export class GetUserProfileResDTO extends createZodDto(UserProfileSchema) {}
