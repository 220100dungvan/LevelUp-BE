import { createZodDto } from 'nestjs-zod'
import { DictionaryLookupQuerySchema, DictionaryLookupResSchema } from '@/modules/dictionary/dictionary.schema'

export class DictionaryLookupQueryDTO extends createZodDto(DictionaryLookupQuerySchema) {}
export class DictionaryLookupResDTO extends createZodDto(DictionaryLookupResSchema) {}
