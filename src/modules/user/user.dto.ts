import { createZodDto } from 'nestjs-zod'
import {
  GetUserResSchema,
  GetUsersQuerySchema,
  GetUsersResSchema,
  UpdateUserBodySchema,
  UpdateUserResSchema,
} from '@/modules/user/user.schema'

export class GetUsersQueryDTO extends createZodDto(GetUsersQuerySchema) {}

export class GetUsersResDTO extends createZodDto(GetUsersResSchema) {}

export class GetUserResDTO extends createZodDto(GetUserResSchema) {}

export class UpdateUserBodyDTO extends createZodDto(UpdateUserBodySchema) {}

export class UpdateUserResDTO extends createZodDto(UpdateUserResSchema) {}
