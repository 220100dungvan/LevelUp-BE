import { BadGatewayException, Injectable, Logger } from '@nestjs/common'
import { VoiceTypeType } from '@/common/constants/article.constant'
import { AudioData } from '@/modules/article/interfaces/audio.types'
import envConfig from '@/common/utils/config'

export interface ArticleAudioResult {
  audioBuffer: Buffer
  speechMarksData: AudioData | null
}

export interface VocabularyAudioBuffers {
  ukBuffer: Buffer
  usBuffer: Buffer
}

@Injectable()
export class TextToSpeechService {
  private readonly logger = new Logger(TextToSpeechService.name)

  // Article

  /**
   * Sinh audio cho bài báo kèm speech-marks metadata.
   * Caller chịu trách nhiệm upload buffer lên Cloudinary.
   */
  async generateArticleAudio(content: string, voiceType: VoiceTypeType): Promise<ArticleAudioResult> {
    const response = await fetch(`${envConfig.FASTAPI_SERVER_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text: content, voice_type: voiceType }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      this.logger.error(`FastAPI TTS (article) lỗi ${response.status}: ${errorText}`)
      throw new BadGatewayException([
        {
          message: 'Error.GenerateArticleAudioFailed',
          detail: errorText || `FastAPI TTS returned ${response.status}`,
        },
      ])
    }

    const contentType = response.headers.get('content-type') ?? ''
    let audioBuffer: Buffer
    let speechMarksData: AudioData | null = null

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { audioBase64?: string; metadata?: AudioData | null }

      if (!data.audioBase64) {
        throw new BadGatewayException([{ message: 'Error.GenerateArticleAudioFailed' }])
      }

      audioBuffer = Buffer.from(data.audioBase64, 'base64')
      speechMarksData = data.metadata ?? null
    } else {
      const arrayBuffer = await response.arrayBuffer()
      if (arrayBuffer.byteLength === 0) {
        throw new BadGatewayException([{ message: 'Error.GenerateArticleAudioFailed' }])
      }

      audioBuffer = Buffer.from(arrayBuffer)
      const speechMarksRaw = response.headers.get('x-audio-metadata')
      speechMarksData = speechMarksRaw ? (JSON.parse(speechMarksRaw) as AudioData) : null
    }

    if (audioBuffer.byteLength === 0) {
      throw new BadGatewayException([{ message: 'Error.GenerateArticleAudioFailed' }])
    }

    return { audioBuffer, speechMarksData }
  }

  // Vocabulary

  /**
   * Sinh audio UK + US cho một từ vựng (song song).
   * Gọi endpoint /tts/vocabulary trên FastAPI — trả về 2 base64 trong 1 request.
   * Caller chịu trách nhiệm upload các buffer lên Cloudinary.
   */
  async generateVocabularyAudioBuffers(word: string): Promise<VocabularyAudioBuffers> {
    const response = await fetch(`${envConfig.FASTAPI_SERVER_URL}/tts/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ word }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      this.logger.error(`FastAPI TTS (vocabulary) lỗi ${response.status}: ${errorText}`)
      throw new BadGatewayException([
        {
          message: 'Error.GenerateVocabularyAudioFailed',
          detail: errorText || `FastAPI TTS returned ${response.status}`,
        },
      ])
    }

    const data = (await response.json()) as { ukAudioBase64?: string; usAudioBase64?: string }

    if (!data.ukAudioBase64 || !data.usAudioBase64) {
      throw new BadGatewayException([{ message: 'Error.GenerateVocabularyAudioFailed' }])
    }

    return {
      ukBuffer: Buffer.from(data.ukAudioBase64, 'base64'),
      usBuffer: Buffer.from(data.usAudioBase64, 'base64'),
    }
  }
}
