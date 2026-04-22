import { EmptyBodySchema } from '@/common/schemas/request.schema'
import { createZodDto } from 'nestjs-zod'

export class EmptyBodyDTO extends createZodDto(EmptyBodySchema) {}
