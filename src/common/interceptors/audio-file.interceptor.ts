import { FileInterceptor } from '@nestjs/platform-express'

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const audioFileInterceptor = FileInterceptor('audio', {
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES },
})
