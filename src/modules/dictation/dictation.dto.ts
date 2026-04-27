// src/modules/dictation/dictation.dto.ts
import { createZodDto } from 'nestjs-zod'
import {
  FinishSessionResSchema,
  StartSessionBodySchema,
  StartSessionResSchema,
  SubmitDictationBodySchema,
  SubmitDictationResSchema,
} from '@/modules/dictation/dictation.schema'

export class StartSessionBodyDTO extends createZodDto(StartSessionBodySchema) {}
export class StartSessionResDTO extends createZodDto(StartSessionResSchema) {}
export class SubmitDictationBodyDTO extends createZodDto(SubmitDictationBodySchema) {}
export class SubmitDictationResDTO extends createZodDto(SubmitDictationResSchema) {}
export class FinishSessionResDTO extends createZodDto(FinishSessionResSchema) {}
