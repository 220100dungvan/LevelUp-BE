import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { VideoRepository } from '@/modules/video/video.repo'
import { Innertube } from 'youtubei.js'
import {
  CreateVideoBodyType,
  CreateVideoSentenceBodyType,
  CreateVideoTopicBodyType,
  GetVideosQueryType,
  ProcessYoutubeVideoUrlBodyType,
  UpdateVideoBodyType,
  UpdateVideoSentenceBodyType,
  UpdateVideoTopicBodyType,
} from '@/modules/video/video.schema'
import envConfig from '@/common/utils/config'
import { isUniqueConstraintPrismaError } from '@/common/utils/helpers'
import { CloudinaryService } from '@/common/services/cloudinary.service'
import { UploadedFileData } from '@/common/types/uploaded-file.type'
import { encryptData } from '@/common/utils/encryption'

interface TranscriptSegment {
  text: string
  offset: number // milliseconds
  duration: number // milliseconds
  lang: string | null
}

@Injectable()
export class VideoService {
  private yt: Innertube | null = null

  private async getYt(): Promise<Innertube> {
    if (!this.yt) {
      this.yt = await Innertube.create()
    }
    return this.yt
  }

  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private toProcessedSentences(transcript: TranscriptSegment[]) {
    return transcript
      .map((item, index) => {
        const content = item.text.replace(/\s+/g, ' ').trim()
        const startTime = Number((item.offset / 1000).toFixed(3))
        const endTime = Number(((item.offset + item.duration) / 1000).toFixed(3))
        return {
          content,
          meaningVi: null,
          ipa: null,
          startTime,
          endTime,
          orderIndex: index,
        }
      })
      .filter((item) => item.content.length > 0)
  }

  private extractVocabularySuggestions(sentences: Array<{ content: string }>) {
    const stopWords = new Set([
      'about',
      'after',
      'again',
      'because',
      'before',
      'between',
      'could',
      'first',
      'great',
      'there',
      'their',
      'these',
      'those',
      'through',
      'would',
      'which',
      'where',
      'while',
      'without',
      'cannot',
      'about',
      'under',
      'into',
    ])

    const frequency = new Map<string, number>()
    for (const sentence of sentences) {
      const words = sentence.content.toLowerCase().match(/[a-z][a-z\-']{4,}/g) ?? []
      for (const word of words) {
        if (stopWords.has(word)) continue
        if (word.length < 7) continue
        frequency.set(word, (frequency.get(word) ?? 0) + 1)
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .slice(0, 12)
      .map(([word]) => word)
  }

  private async enrichSentencesWithAi(params: {
    title: string
    sentences: Array<{
      content: string
      meaningVi: string | null
      ipa: string | null
      startTime: number
      endTime: number
      orderIndex: number
    }>
  }) {
    const apiKey = envConfig.GROQ_API_KEY
    if (!apiKey || params.sentences.length === 0) {
      return { sentences: params.sentences, aiProcessed: false }
    }

    const inputItems = params.sentences.slice(0, 120).map((sentence) => ({
      orderIndex: sentence.orderIndex,
      content: sentence.content,
      startTime: sentence.startTime,
      endTime: sentence.endTime,
    }))

    try {
      const response = await fetch(envConfig.GROQ_CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a language assistant helping Vietnamese learners study English.
For each sentence, provide:
- "meaningVi": Vietnamese translation of the sentence
- "ipa": IPA phonetic transcription of the English sentence

Return ONLY a JSON object in this exact format, no explanation:
{"sentences":[{"orderIndex":0,"ipa":"...","meaningVi":"..."}]}

Rules:
- Every sentence MUST have meaningVi and ipa filled in (do not return null unless the text is empty or non-English)
- Keep all orderIndex values exactly as given`,
            },
            {
              role: 'user',
              content: `Video title: "${params.title}"
Translate and transcribe these English sentences:
${JSON.stringify(inputItems)}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('Groq error:', errorBody)
        return { sentences: params.sentences, aiProcessed: false }
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const content = payload.choices?.[0]?.message?.content
      if (!content) return { sentences: params.sentences, aiProcessed: false }

      const parsed = JSON.parse(content) as {
        sentences?: Array<{ orderIndex: number; ipa?: string | null; meaningVi?: string | null }>
      }

      const aiMap = new Map((parsed.sentences ?? []).map((item) => [item.orderIndex, item]))

      const enriched = params.sentences.map((sentence) => {
        const aiSentence = aiMap.get(sentence.orderIndex)
        return {
          ...sentence,
          ipa: aiSentence?.ipa ?? sentence.ipa,
          meaningVi: aiSentence?.meaningVi ?? sentence.meaningVi,
        }
      })

      return { sentences: enriched, aiProcessed: true }
    } catch (error) {
      console.error('Groq fetch error:', error)
      return { sentences: params.sentences, aiProcessed: false }
    }
  }

  private extractYoutubeVideoId(rawUrl: string): string | null {
    try {
      const url = new URL(rawUrl)
      const host = url.hostname.replace('www.', '')

      if (host === 'youtu.be') {
        return url.pathname.split('/').filter(Boolean)[0] ?? null
      }

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (url.pathname === '/watch') {
          return url.searchParams.get('v')
        }

        if (url.pathname.startsWith('/shorts/')) {
          return url.pathname.split('/').filter(Boolean)[1] ?? null
        }

        if (url.pathname.startsWith('/embed/')) {
          return url.pathname.split('/').filter(Boolean)[1] ?? null
        }
      }

      return null
    } catch {
      return null
    }
  }

  async processYoutubeVideoUrl(body: ProcessYoutubeVideoUrlBodyType) {
    const videoId = this.extractYoutubeVideoId(body.youtubeUrl)
    if (!videoId) {
      throw new UnprocessableEntityException([
        {
          path: 'youtubeUrl',
          message: 'Error.InvalidYoutubeUrl',
        },
      ])
    }

    const normalizedVideoUrl = `https://www.youtube.com/watch?v=${videoId}`
    const embedUrl = `https://www.youtube.com/embed/${videoId}`

    let title = `YouTube Video ${videoId}`
    let thumbnailUrl: string | null = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    let durationSec: number | null = null
    let transcriptResult: { transcript: TranscriptSegment[]; language: string } | null = null

    try {
      const yt = await this.getYt()
      const info = await yt.getInfo(videoId)

      title = info.basic_info.title || title
      durationSec = info.basic_info.duration ?? null
      const thumbnails = info.basic_info.thumbnail
      if (Array.isArray(thumbnails) && thumbnails.length > 0) {
        thumbnailUrl = thumbnails.at(-1)?.url ?? thumbnailUrl
      }
    } catch (error) {
      console.error('Error fetching YouTube video info:', error)
    }

    // oEmbed fallback cho metadata
    if (!title || !thumbnailUrl) {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedVideoUrl)}&format=json`,
        )
        if (response.ok) {
          const data = (await response.json()) as { title?: string; thumbnail_url?: string }
          title = data.title || title
          thumbnailUrl = data.thumbnail_url || thumbnailUrl
        }
      } catch {
        // Keep fallback metadata.
        console.log('lỗi')
      }
    }

    // Lấy transcript
    transcriptResult = await this.fetchTranscript(videoId)

    const baseSentences = transcriptResult ? this.toProcessedSentences(transcriptResult.transcript) : []

    const aiResult = await this.enrichSentencesWithAi({ title, sentences: baseSentences })
    const subtitleAvailable = aiResult.sentences.length > 0

    return {
      youtubeVideoId: videoId,
      videoUrl: normalizedVideoUrl,
      embedUrl,
      title,
      thumbnailUrl,
      durationSec,
      sentences: aiResult.sentences,
      subtitleAvailable,
      aiProcessed: aiResult.aiProcessed,
      transcriptLanguage: transcriptResult?.language ?? null,
      vocabularySuggestions: this.extractVocabularySuggestions(aiResult.sentences),
    }
  }

  private async fetchTranscript(
    videoId: string,
  ): Promise<{ transcript: TranscriptSegment[]; language: string } | null> {
    try {
      const params = new URLSearchParams({
        engine: 'youtube_video_transcript',
        v: videoId,
        language_code: 'en',
        api_key: envConfig.SERPAPI_KEY,
      })

      const response = await fetch(`https://serpapi.com/search?${params}`)
      if (!response.ok) return null

      const data = (await response.json()) as {
        transcript?: Array<{
          start_ms?: number
          end_ms?: number
          snippet?: string
          start_time_text?: string
          start_time_label?: string
        }>
        search_parameters?: {
          language_code?: string
        }
        search_information?: {
          results_state?: string
        }
        error?: string
      }

      // SerpApi can return success with empty transcript payload.
      if (data.error || !Array.isArray(data.transcript) || data.transcript.length === 0) {
        return null
      }

      const language = data.search_parameters?.language_code || 'en'
      const sortedItems = [...data.transcript].sort((a, b) => (a.start_ms ?? 0) - (b.start_ms ?? 0))

      const segments: TranscriptSegment[] = sortedItems
        .map((item, index, arr) => {
          const text = (item.snippet || '').replace(/\n/g, ' ').trim()
          const offset = item.start_ms ?? 0

          let duration = 0
          if (typeof item.end_ms === 'number' && item.end_ms >= offset) {
            duration = item.end_ms - offset
          } else {
            const nextOffset = arr[index + 1]?.start_ms
            // Fallback for records without end_ms: estimate by next segment start or default 2 seconds.
            duration = typeof nextOffset === 'number' && nextOffset > offset ? nextOffset - offset : 2000
          }

          return {
            text,
            offset,
            duration,
            lang: language,
          }
        })
        .filter((seg) => seg.text.length > 0)

      return segments.length > 0 ? { transcript: segments, language } : null
    } catch (error) {
      console.error('Error fetching transcript from SerpApi:', error)
      return null
    }
  }

  async getVideoTopics() {
    const topics = await this.videoRepository.findAllTopics()
    return { data: topics }
  }

  getVideos(query: GetVideosQueryType, userId?: string) {
    return this.videoRepository.findVideos(query, userId)
  }

  async getVideoById(videoId: string) {
    const video = await this.videoRepository.findVideoById(videoId)

    let recommendedVideos: { id: string; title: string; thumbnailUrl: string | null }[] = []

    if (video && video.topicIds && video.topicIds.length > 0) {
      recommendedVideos = await this.videoRepository.findVideosByTopicIds(video.topicIds, videoId)
    }
    if (!video) throw new NotFoundException('Error.VideoNotFound')
    const { encryptedData, iv } = encryptData(JSON.stringify(video.vocabularies))

    const url = new URL(video.videoUrl)
    const watchId = url.searchParams.get('v')
    const embedUrl = watchId ? `https://www.youtube.com/embed/${watchId}` : video.videoUrl
    return {
      id: video.id,
      topicIds: video.topicIds,
      level: video.level,
      title: video.title,
      videoUrl: video.videoUrl,
      embedUrl: embedUrl,
      thumbnailUrl: video.thumbnailUrl,
      durationSec: video.durationSec,
      createdAt: video.createdAt,
      deletedAt: video.deletedAt,
      topics: video.topics,
      sentences: video.sentences,
      sentenceCount: video.sentenceCount,
      sessionCount: video.sessionCount,
      avgScore: video.avgScore,
      encryptedVocabularies: encryptedData,
      vocabulariesIv: iv,
      recommendedVideos: recommendedVideos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        level: video.level,
      })),
    }
  }

  async createTopic(body: CreateVideoTopicBodyType, thumbnail: UploadedFileData) {
    if (!thumbnail) {
      throw new UnprocessableEntityException([
        {
          path: 'thumbnail',
          message: 'Error.ThumbnailIsRequired',
        },
      ])
    }

    const thumbnailUrl = await this.cloudinaryService.uploadImage(thumbnail)
    return this.videoRepository.createTopic(body, thumbnailUrl)
  }

  async updateTopic(topicId: string, body: UpdateVideoTopicBodyType, thumbnail?: UploadedFileData) {
    const topic = await this.videoRepository.findTopicById(topicId)
    if (!topic) throw new NotFoundException('Error.VideoTopicNotFound')

    const thumbnailUrl = thumbnail ? await this.cloudinaryService.uploadImage(thumbnail) : undefined
    return this.videoRepository.updateTopic(topicId, body, thumbnailUrl)
  }

  async deleteTopic(topicId: string) {
    const topic = await this.videoRepository.findTopicById(topicId)
    if (!topic) throw new NotFoundException('Error.VideoTopicNotFound')
    await this.videoRepository.softDeleteTopic(topicId)
    return { message: 'Xóa chủ đề video thành công' }
  }

  async createVideo(body: CreateVideoBodyType) {
    const topicIds = [...new Set(body.topicIds ?? [])]
    if (topicIds.length > 0) {
      const existingTopicCount = await this.videoRepository.countTopicsByIds(topicIds)
      if (existingTopicCount !== topicIds.length) {
        throw new NotFoundException('Error.VideoTopicNotFound')
      }
    }

    const vocabularyIds = [...new Set(body.vocabularyIds ?? [])]
    if (vocabularyIds.length > 0) {
      const existingVocabularyCount = await this.videoRepository.countVocabularyByIds(vocabularyIds)
      if (existingVocabularyCount !== vocabularyIds.length) {
        throw new NotFoundException('Error.VocabularyNotFound')
      }
    }

    let created: { id: string }
    try {
      created =
        body.sentences && body.sentences.length > 0
          ? await this.videoRepository.createVideoWithSentences(body)
          : await this.videoRepository.createVideo(body)
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnprocessableEntityException([
          {
            path: 'videoUrl',
            message: 'Error.VideoUrlAlreadyExists',
          },
        ])
      }
      throw error
    }

    if (vocabularyIds.length > 0) {
      await this.videoRepository.linkVideoVocabularies(created.id, vocabularyIds)
    }

    return this.getVideoById(created.id)
  }

  async updateVideo(videoId: string, body: UpdateVideoBodyType) {
    const existing = await this.videoRepository.findVideoById(videoId)
    if (!existing) throw new NotFoundException('Error.VideoNotFound')

    if (body.topicIds) {
      const uniqueTopicIds = [...new Set(body.topicIds)]
      if (uniqueTopicIds.length > 0) {
        const existingTopicCount = await this.videoRepository.countTopicsByIds(uniqueTopicIds)
        if (existingTopicCount !== uniqueTopicIds.length) {
          throw new NotFoundException('Error.VideoTopicNotFound')
        }
      }

      await this.videoRepository.replaceVideoTopics(videoId, uniqueTopicIds)
    }

    await this.videoRepository.updateVideo(videoId, body)
    return this.getVideoById(videoId)
  }

  async deleteVideo(videoId: string) {
    const existing = await this.videoRepository.findVideoById(videoId)
    if (!existing) throw new NotFoundException('Error.VideoNotFound')
    await this.videoRepository.softDeleteVideo(videoId)
    return { message: 'Xóa video thành công' }
  }

  async createSentence(videoId: string, body: CreateVideoSentenceBodyType) {
    const video = await this.videoRepository.findVideoById(videoId)
    if (!video) throw new NotFoundException('Error.VideoNotFound')

    const orderIndex = body.orderIndex ?? (await this.videoRepository.getNextSentenceOrderIndex(videoId))
    return this.videoRepository.createSentence(videoId, { ...body, orderIndex })
  }

  async updateSentence(videoId: string, sentenceId: number, body: UpdateVideoSentenceBodyType) {
    const video = await this.videoRepository.findVideoById(videoId)
    if (!video) throw new NotFoundException('Error.VideoNotFound')

    const sentence = await this.videoRepository.findSentenceById(sentenceId)
    if (!sentence || sentence.videoId !== videoId) {
      throw new NotFoundException('Error.VideoSentenceNotFound')
    }

    return this.videoRepository.updateSentence(sentenceId, body)
  }

  async deleteSentence(videoId: string, sentenceId: number) {
    const video = await this.videoRepository.findVideoById(videoId)
    if (!video) throw new NotFoundException('Error.VideoNotFound')

    const sentence = await this.videoRepository.findSentenceById(sentenceId)
    if (!sentence || sentence.videoId !== videoId) {
      throw new NotFoundException('Error.VideoSentenceNotFound')
    }

    await this.videoRepository.deleteSentence(sentenceId)
    return { message: 'Xóa câu thoại thành công' }
  }
}
