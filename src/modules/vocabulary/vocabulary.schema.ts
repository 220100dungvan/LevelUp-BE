import { Level, VocabStatus } from '@/common/constants/vocabulary.constant'
import z from 'zod'

export const VocabularyTopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

export const CreateTopicBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
  })
  .strict()

export const UpdateTopicBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Phải cung cấp ít nhất một trường để cập nhật',
        path: [],
      })
    }
  })

export const GetTopicsResSchema = z.object({
  data: z.array(VocabularyTopicSchema),
})

export const VocabularySchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  phoneticUk: z.string().nullable(),
  phoneticUs: z.string().nullable(),
  partOfSpeech: z.string().nullable(),
  meaningVi: z.string(),
  meaningEn: z.string().nullable(),
  exampleEn: z.string().nullable(),
  exampleVi: z.string().nullable(),
  imageUrl: z.string().nullable(),
  audioUrlUk: z.string().nullable(),
  audioUrlUs: z.string().nullable(),
  audioExampleUrl: z.string().nullable(),
  level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).nullable(),
})

export const CreateVocabularyBodySchema = z
  .object({
    word: z.string().min(1).max(200),
    phoneticUk: z.string().max(200).optional(),
    phoneticUs: z.string().max(200).optional(),
    partOfSpeech: z.string().max(100).optional(),
    meaningVi: z.string().min(1),
    meaningEn: z.string().optional(),
    exampleEn: z.string().optional(),
    exampleVi: z.string().optional(),
    level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).optional(),
  })
  .strict()

export const CreateVocabularyResSchema = VocabularySchema

export const GetListsQuerySchema = z
  .object({
    topicId: z.string().uuid().optional(),
    level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().optional(),
  })
  .strict()

export const VocabularyListSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).nullable(),
  isPublic: z.boolean(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  totalWords: z.number().int(),
  topic: z.object({
    id: z.string().uuid(),
    name: z.string(),
    thumbnailUrl: z.string().nullable(),
  }),
  creator: z.object({
    id: z.string().uuid(),
    fullName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
})

export const GetListsResSchema = z.object({
  data: z.array(VocabularyListSummarySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const CreateVocabularyListBodySchema = z
  .object({
    topicId: z.string().uuid(),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).optional(),
    isPublic: z.boolean().default(true),
  })
  .strict()

export const GetListDetailResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).nullable(),
  isPublic: z.boolean(),
  topic: z.object({
    id: z.string().uuid(),
    name: z.string(),
    thumbnailUrl: z.string().nullable(),
  }),
  creator: z.object({
    id: z.string().uuid(),
    fullName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  totalWords: z.number(),
  // Encrypted payload — FE dùng shared key để decrypt
  encryptedData: z.string(),
  iv: z.string(),
})

export const UpdateVocabularyListBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]).optional(),
    isPublic: z.boolean().optional(),
    topicId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Phải cung cấp ít nhất một trường để cập nhật',
        path: [],
      })
    }
  })

export const DeleteVocabularyListResSchema = z.object({
  message: z.string(),
})

export const AddItemsByIdsBodySchema = z
  .object({
    vocabularyIds: z.array(z.string().uuid()).min(1, 'Phải cung cấp ít nhất một vocabularyId'),
  })
  .strict()

export const AddNewVocabularyToListBodySchema = z
  .object({
    word: z.string().min(1).max(200),
    meaningVi: z.string().min(1),
    meaningEn: z.string().optional(),
    phoneticUk: z.string().max(200).optional(),
    phoneticUs: z.string().max(200).optional(),
    partOfSpeech: z.string().max(100).optional(),
    exampleEn: z.string().optional(),
    exampleVi: z.string().optional(),
    level: z.enum([Level.Beginner, Level.Advanced, Level.Intermediate]),
  })
  .strict()

export const AddItemsToListResSchema = z.object({
  added: z.number().int(),
  skipped: z.number().int(), // đã có trong list rồi
})

export const ReorderItemsBodySchema = z
  .object({
    // mảng vocabularyId theo thứ tự mới
    orderedVocabularyIds: z.array(z.string().uuid()).min(1),
  })
  .strict()

export const SubmitLearningWordResSchema = z.object({
  status: z.enum([VocabStatus.New, VocabStatus.Easy, VocabStatus.Hard, VocabStatus.Medium, VocabStatus.Mastered]),
  correctCount: z.number(),
  wrongCount: z.number(),
  nextReviewAt: z
    .preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime())
    .nullable(),
})

export const SubmitLearningWordBodySchema = z
  .object({
    listId: z.string().uuid(),
    vocabularyId: z.string().uuid(),
    status: z.enum([VocabStatus.New, VocabStatus.Easy, VocabStatus.Hard, VocabStatus.Medium, VocabStatus.Mastered]),
    isCorrect: z.boolean(),
  })
  .strict()

export const GetLearningProgressOverviewQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(365).default(180),
  })
  .strict()

const LearningProgressHeatmapItemSchema = z.object({
  date: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  learnedCount: z.number().int(),
  reviewedCount: z.number().int(),
  correctCount: z.number().int(),
  wrongCount: z.number().int(),
  totalActivity: z.number().int(),
})

export const GetLearningProgressOverviewResSchema = z.object({
  summary: z.object({
    learnedWords: z.number().int(),
    rememberedWords: z.number().int(),
    needReviewWords: z.number().int(),
  }),
  heatmap: z.array(LearningProgressHeatmapItemSchema),
})

export const GetLearningProgressByListResSchema = z.object({
  summary: z.object({
    totalWordsInList: z.number().int(),
    learnedWords: z.number().int(),
    rememberedWords: z.number().int(),
    needReviewWords: z.number().int(),
  }),
  heatmap: z.array(LearningProgressHeatmapItemSchema),
})

export const CreateVocabularyListResSchema = VocabularyListSummarySchema

export const SearchVocabularyResSchema = z.object({
  data: z.array(VocabularySchema),
})

export const SearchVocabularyQuerySchema = z
  .object({
    word: z.string().min(1).max(200),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict()

export type GetListsQueryType = z.infer<typeof GetListsQuerySchema>
export type GetListsResType = z.infer<typeof GetListsResSchema>
export type GetTopicsResType = z.infer<typeof GetTopicsResSchema>
export type CreateVocabularyListBodyType = z.infer<typeof CreateVocabularyListBodySchema>
export type UpdateVocabularyListBodyType = z.infer<typeof UpdateVocabularyListBodySchema>
export type CreateVocabularyBodyType = z.infer<typeof CreateVocabularyBodySchema>
export type ReorderItemsBodyType = z.infer<typeof ReorderItemsBodySchema>
export type SubmitLearningWordBodyType = z.infer<typeof SubmitLearningWordBodySchema>
export type CreateTopicBodyType = z.infer<typeof CreateTopicBodySchema>
export type UpdateTopicBodyType = z.infer<typeof UpdateTopicBodySchema>
export type GetLearningProgressOverviewQueryType = z.infer<typeof GetLearningProgressOverviewQuerySchema>
export type SearchVocabularyQueryType = z.infer<typeof SearchVocabularyQuerySchema>
export type AddItemsByIdsBodyType = z.infer<typeof AddItemsByIdsBodySchema>
export type AddNewVocabularyToListBodyType = z.infer<typeof AddNewVocabularyToListBodySchema>
