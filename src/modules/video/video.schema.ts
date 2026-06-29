import { Level } from '@/common/constants/vocabulary.constant'
import z from 'zod'

const LevelEnum = z.enum([
  Level.Beginner,
  Level.Elementary,
  Level.Intermediate,
  Level.Upper_Inter,
  Level.Advanced,
  Level.Mastery,
])

export const VideoTopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
})

export const GetVideoTopicsResSchema = z.object({
  data: z.array(VideoTopicSchema),
})

export const CreateVideoTopicBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
  })
  .strict()

export const UpdateVideoTopicBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Phải cung cấp ít nhất một trường để cập nhật',
      })
    }
  })

export const VideoSentenceSchema = z.object({
  id: z.number().int(),
  videoId: z.string().uuid(),
  content: z.string(),
  meaningVi: z.string().nullable(),
  ipa: z.string().nullable(),
  startTime: z.number(),
  endTime: z.number(),
  orderIndex: z.number().int(),
})

export const VideoVocabularySchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  phonetic: z.string().nullable(),
  partOfSpeech: z.string().nullable(),
  meaningVi: z.string(),
  meaningEn: z.string().nullable(),
  exampleEn: z.string().nullable(),
  exampleVi: z.string().nullable(),
  imageUrl: z.string().nullable(),
  audioUrl: z.string().nullable(),
  audioExampleUrl: z.string().nullable(),
  level: LevelEnum.nullable(),
})

export const GetVideosQuerySchema = z.object({
  topicId: z.string().uuid().optional(),
  level: LevelEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const CreateVideoBodySchema = z
  .object({
    topicIds: z.array(z.string().uuid()).optional(),
    level: LevelEnum.optional(),
    title: z.string().min(1).max(300),
    videoUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    durationSec: z.number().int().min(0).optional(),
    sentences: z
      .array(
        z
          .object({
            content: z.string().min(1),
            meaningVi: z.string().optional(),
            ipa: z.string().optional(),
            startTime: z.number().min(0),
            endTime: z.number().min(0),
            orderIndex: z.number().int().min(0).optional(),
          })
          .superRefine((item, ctx) => {
            if (item.endTime < item.startTime) {
              ctx.addIssue({
                code: 'custom',
                message: 'endTime phải lớn hơn hoặc bằng startTime',
                path: ['endTime'],
              })
            }
          }),
      )
      .optional(),
    vocabularyIds: z.array(z.string().uuid()).optional(),
  })
  .strict()

export const ProcessYoutubeVideoUrlBodySchema = z
  .object({
    youtubeUrl: z.string().url(),
  })
  .strict()

export const ProcessedVideoSentenceSchema = z.object({
  content: z.string(),
  meaningVi: z.string().nullable(),
  ipa: z.string().nullable(),
  startTime: z.number(),
  endTime: z.number(),
  orderIndex: z.number().int(),
})

export const ProcessYoutubeVideoUrlResSchema = z.object({
  youtubeVideoId: z.string(),
  videoUrl: z.string().url(),
  embedUrl: z.string().url(),
  title: z.string(),
  thumbnailUrl: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  sentences: z.array(ProcessedVideoSentenceSchema),
  subtitleAvailable: z.boolean(),
  aiProcessed: z.boolean(),
  transcriptLanguage: z.string().nullable(),
  vocabularySuggestions: z.array(z.string()),
})

export const UpdateVideoBodySchema = z
  .object({
    topicIds: z.array(z.string().uuid()).optional(),
    level: LevelEnum.nullable().optional(),
    title: z.string().min(1).max(300).optional(),
    videoUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().nullable().optional(),
    durationSec: z.number().int().min(0).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Phải cung cấp ít nhất một trường để cập nhật',
      })
    }
  })

export const CreateVideoSentenceBodySchema = z
  .object({
    content: z.string().min(1),
    meaningVi: z.string().optional(),
    ipa: z.string().optional(),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
    orderIndex: z.number().int().min(0).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.endTime < data.startTime) {
      ctx.addIssue({
        code: 'custom',
        message: 'endTime phải lớn hơn hoặc bằng startTime',
        path: ['endTime'],
      })
    }
  })

export const UpdateVideoSentenceBodySchema = z
  .object({
    content: z.string().min(1).optional(),
    meaningVi: z.string().nullable().optional(),
    ipa: z.string().nullable().optional(),
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
    orderIndex: z.number().int().min(0).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Phải cung cấp ít nhất một trường để cập nhật',
      })
    }
    if (data.startTime !== undefined && data.endTime !== undefined && data.endTime < data.startTime) {
      ctx.addIssue({
        code: 'custom',
        message: 'endTime phải lớn hơn hoặc bằng startTime',
        path: ['endTime'],
      })
    }
  })

export const VideoListItemSchema = z.object({
  id: z.string().uuid(),
  topicIds: z.array(z.string().uuid()),
  level: LevelEnum.nullable(),
  title: z.string(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  topics: z.array(VideoTopicSchema.pick({ id: true, name: true, thumbnailUrl: true })),
  sentenceCount: z.number().int(),
  sessionCount: z.number().int(), // số lượt học (tất cả user)
  hasDictationPracticed: z.boolean(),
  hasShadowingPracticed: z.boolean(),
})

export const GetVideosResSchema = z.object({
  data: z.array(VideoListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
})

export const GetVideoDetailResSchema = z.object({
  id: z.string().uuid(),
  topicIds: z.array(z.string().uuid()),
  level: LevelEnum.nullable(),
  title: z.string(),
  videoUrl: z.string(),
  embedUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  durationSec: z.number().int().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  topics: z.array(VideoTopicSchema.pick({ id: true, name: true, thumbnailUrl: true })),
  sentences: z.array(VideoSentenceSchema),
  sentenceCount: z.number().int(),
  sessionCount: z.number().int(),
  avgScore: z.number().nullable(),
  encryptedVocabularies: z.string(),
  vocabulariesIv: z.string(),
  recommendedVideos: z.array(VideoListItemSchema.pick({ id: true, title: true, thumbnailUrl: true, level: true })),
})

export const AddVideoVocabulariesBodySchema = z
  .object({
    vocabularyIds: z.array(z.string().uuid()).min(1),
  })
  .strict()

export const RemoveVideoVocabularyParamsSchema = z.object({
  videoId: z.string().uuid(),
  vocabularyId: z.string().uuid(),
})

export type GetVideosQueryType = z.infer<typeof GetVideosQuerySchema>
export type GetVideosResType = z.infer<typeof GetVideosResSchema>
export type GetVideoDetailResType = z.infer<typeof GetVideoDetailResSchema>
export type CreateVideoTopicBodyType = z.infer<typeof CreateVideoTopicBodySchema>
export type UpdateVideoTopicBodyType = z.infer<typeof UpdateVideoTopicBodySchema>
export type CreateVideoBodyType = z.infer<typeof CreateVideoBodySchema>
export type UpdateVideoBodyType = z.infer<typeof UpdateVideoBodySchema>
export type CreateVideoSentenceBodyType = z.infer<typeof CreateVideoSentenceBodySchema>
export type UpdateVideoSentenceBodyType = z.infer<typeof UpdateVideoSentenceBodySchema>
export type ProcessYoutubeVideoUrlBodyType = z.infer<typeof ProcessYoutubeVideoUrlBodySchema>
export type GetVideoTopicsResType = z.infer<typeof GetVideoTopicsResSchema>

export type AddVideoVocabulariesBodyType = z.infer<typeof AddVideoVocabulariesBodySchema>
export type RemoveVideoVocabularyParamsType = z.infer<typeof RemoveVideoVocabularyParamsSchema>
