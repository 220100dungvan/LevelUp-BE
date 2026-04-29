import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import envConfig from '@/common/utils/config'

export interface TranscribeResult {
  text: string
}

interface GroqTranscriptionResponse {
  text: string
}

@Injectable()
export class SpeechToTextService {
  private readonly logger = new Logger(SpeechToTextService.name)

  async transcribe(buffer: Buffer, mimetype: string, language = 'vi'): Promise<TranscribeResult> {
    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Audio buffer rỗng, không thể nhận dạng.')
    }

    const ext = this.resolveExtension(mimetype)
    this.logger.debug(
      `Groq STT | model=${envConfig.GROQ_STT_MODEL} | size=${buffer.length}B | lang=${language} | ext=${ext}`,
    )

    const safeArrayBuffer = new Uint8Array(buffer).buffer

    const form = new FormData()
    form.append('file', new Blob([safeArrayBuffer], { type: mimetype }), `audio.${ext}`)
    form.append('model', envConfig.GROQ_STT_MODEL)
    form.append('language', language)
    form.append('response_format', 'json')
    form.append('temperature', '0')

    try {
      const response = await fetch(envConfig.GROQ_AUDIO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${envConfig.GROQ_API_KEY}`,
        },
        body: form,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        this.logger.error(`Groq STT HTTP ${response.status}: ${errorBody}`)
        throw new InternalServerErrorException('Nhận dạng giọng nói thất bại. Vui lòng thử lại.')
      }

      const data = (await response.json()) as GroqTranscriptionResponse
      const text = data.text.trim()

      this.logger.debug(`STT result: "${text}"`)
      return { text }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error
      this.logger.error('Groq STT lỗi không xác định', error instanceof Error ? error.stack : String(error))
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
