import { createZodDto } from 'nestjs-zod'
import {
  FinishSessionResSchema,
  StartSessionBodySchema,
  StartSessionResSchema,
  SubmitShadowingBodySchema,
  SubmitShadowingResSchema,
} from '@/modules/shadowing/shadowing.schema'

export class StartSessionBodyDTO extends createZodDto(StartSessionBodySchema) {}
export class StartSessionResDTO extends createZodDto(StartSessionResSchema) {}
export class SubmitShadowingBodyDTO extends createZodDto(SubmitShadowingBodySchema) {}
export class SubmitShadowingResDTO extends createZodDto(SubmitShadowingResSchema) {}
export class FinishSessionResDTO extends createZodDto(FinishSessionResSchema) {}
