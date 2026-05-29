import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import envConfig from '@/common/utils/config'

export interface TranscribeResult {
  text: string
}

interface FastAPISTTResponse {
  text: string
  language: string
}

@Injectable()
export class SpeechToTextService {
  private readonly logger = new Logger(SpeechToTextService.name)

  async transcribe(buffer: Buffer, mimetype: string, language = 'en'): Promise<TranscribeResult> {
    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Audio buffer rỗng, không thể nhận dạng.')
    }

    const ext = this.resolveExtension(mimetype)
    this.logger.debug(`FastAPI STT | size=${buffer.length}B | lang=${language} | ext=${ext}`)

    const safeArrayBuffer = new Uint8Array(buffer).buffer

    const form = new FormData()
    form.append('file', new Blob([safeArrayBuffer], { type: mimetype }), `audio.${ext}`)
    form.append('language', language)

    try {
      const response = await fetch(`${envConfig.FASTAPI_SERVER_URL}/stt`, {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        this.logger.error(`FastAPI STT HTTP ${response.status}: ${errorBody}`)
        throw new InternalServerErrorException('Nhận dạng giọng nói thất bại. Vui lòng thử lại.')
      }

      const data = (await response.json()) as FastAPISTTResponse
      const text = data.text.trim()

      this.logger.debug(`STT result: "${text}" | detected language: ${data.language}`)
      return { text }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error
      this.logger.error('FastAPI STT lỗi không xác định', error instanceof Error ? error.stack : String(error))
      throw new InternalServerErrorException('Nhận dạng giọng nói thất bại. Vui lòng thử lại.')
    }
  }

  /**
   * Map mimetype => file extension hợp lệ theo docs Groq:
   */
  private resolveExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'audio/webm': 'webm',
      'video/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mp4': 'mp4',
      'audio/m4a': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/flac': 'flac',
      'audio/x-m4a': 'm4a',
    }
    return map[mimetype] ?? 'webm'
  }
}
