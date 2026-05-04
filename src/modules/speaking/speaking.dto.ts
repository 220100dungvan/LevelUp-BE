import {
  CreateSessionBodySchema,
  CreateSessionResSchema,
  GetSessionsQuerySchema,
  GetSessionsResSchema,
  GetSpeakingTopicsResSchema,
  JoinQueueBodySchema,
  JoinQueueResSchema,
  JoinSessionBodySchema,
  JoinSessionResSchema,
} from '@/modules/speaking/speaking.schema'
import { createZodDto } from 'nestjs-zod'

export class GetSpeakingTopicsResDTO extends createZodDto(GetSpeakingTopicsResSchema) {}

export class GetSessionsQueryDTO extends createZodDto(GetSessionsQuerySchema) {}

export class GetSessionsResDTO extends createZodDto(GetSessionsResSchema) {}

export class CreateSessionBodyDTO extends createZodDto(CreateSessionBodySchema) {}
export class CreateSessionResDTO extends createZodDto(CreateSessionResSchema) {}

export class JoinQueueBodyDTO extends createZodDto(JoinQueueBodySchema) {}
export class JoinQueueResDTO extends createZodDto(JoinQueueResSchema) {}

export class JoinSessionBodyDTO extends createZodDto(JoinSessionBodySchema) {}
export class JoinSessionResDTO extends createZodDto(JoinSessionResSchema) {}
