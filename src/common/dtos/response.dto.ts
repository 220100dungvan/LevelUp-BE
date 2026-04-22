import { MessageResSchema } from '@/common/schemas/response.schema'
import { createZodDto } from 'nestjs-zod'

export class MessageResDTO extends createZodDto(MessageResSchema) {}
