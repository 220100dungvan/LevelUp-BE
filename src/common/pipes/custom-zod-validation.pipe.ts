import { UnprocessableEntityException } from '@nestjs/common'
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod'
import { ZodError } from 'zod'

const CustomZodValidationPipe: typeof ZodValidationPipe = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: unknown) => {
    if (error instanceof ZodError) {
      return new UnprocessableEntityException(
        error.issues.map((err) => {
          return {
            ...err,
            path: err.path.join('.'),
          }
        }),
      )
    }
    return new UnprocessableEntityException('Validation failed')
  },
})

export default CustomZodValidationPipe
