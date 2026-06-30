import { Level, PART_OF_SPEECH, VocabStatus } from '@/common/constants/vocabulary.constant'
import z from 'zod'

export const VocabularyTopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

export const CreateVocabularyTopicBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
  })
  .strict()

export const UpdateVocabularyTopicBodySchema = z
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
  partOfSpeech: z.enum([
    PART_OF_SPEECH.NOUN,
    PART_OF_SPEECH.VERB,
    PART_OF_SPEECH.ADJECTIVE,
    PART_OF_SPEECH.ADVERB,
    PART_OF_SPEECH.PRONOUN,
    PART_OF_SPEECH.PREPOSITION,
    PART_OF_SPEECH.CONJUNCTION,
    PART_OF_SPEECH.INTERJECTION,
    PART_OF_SPEECH.DETERMINER,
    PART_OF_SPEECH.NUMERAL,
    PART_OF_SPEECH.PHRASE,
    PART_OF_SPEECH.OTHER,
  ]),
  meaningVi: z.string(),
  meaningEn: z.string().nullable(),
  exampleEn: z.string().nullable(),
  exampleVi: z.string().nullable(),
  imageUrl: z.string().nullable(),
  audioUrlUk: z.string().nullable(),
  audioUrlUs: z.string().nullable(),
  audioExampleUrl: z.string().nullable(),
  level: z
    .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
    .nullable(),
})

export const CreateVocabularyBodySchema = z
  .object({
    word: z.string().min(1).max(200),
    phoneticUk: z.string().max(200).optional(),
    phoneticUs: z.string().max(200).optional(),
    partOfSpeech: z.enum([
      PART_OF_SPEECH.NOUN,
      PART_OF_SPEECH.VERB,
      PART_OF_SPEECH.ADJECTIVE,
      PART_OF_SPEECH.ADVERB,
      PART_OF_SPEECH.PRONOUN,
      PART_OF_SPEECH.PREPOSITION,
      PART_OF_SPEECH.CONJUNCTION,
      PART_OF_SPEECH.INTERJECTION,
      PART_OF_SPEECH.DETERMINER,
      PART_OF_SPEECH.NUMERAL,
      PART_OF_SPEECH.PHRASE,
      PART_OF_SPEECH.OTHER,
    ]),
    meaningVi: z.string().min(1),
    meaningEn: z.string().optional(),
    exampleEn: z.string().optional(),
    exampleVi: z.string().optional(),
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
  })
  .strict()

export const CreateVocabularyResSchema = VocabularySchema

export const GetListsQuerySchema = z
  .object({
    topicId: z.string().uuid().optional(),
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().optional(),
  })
  .strict()

export const VocabularyListSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z
    .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
    .nullable(),
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
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
    isPublic: z.boolean().default(true),
  })
  .strict()

export const GetListDetailResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z
    .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
    .nullable(),
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
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
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
    partOfSpeech: z.enum([
      PART_OF_SPEECH.NOUN,
      PART_OF_SPEECH.VERB,
      PART_OF_SPEECH.ADJECTIVE,
      PART_OF_SPEECH.ADVERB,
      PART_OF_SPEECH.PRONOUN,
      PART_OF_SPEECH.PREPOSITION,
      PART_OF_SPEECH.CONJUNCTION,
      PART_OF_SPEECH.INTERJECTION,
      PART_OF_SPEECH.DETERMINER,
      PART_OF_SPEECH.NUMERAL,
      PART_OF_SPEECH.PHRASE,
      PART_OF_SPEECH.OTHER,
    ]),
    exampleEn: z.string().optional(),
    exampleVi: z.string().optional(),
    level: z.enum([
      Level.Beginner,
      Level.Elementary,
      Level.Intermediate,
      Level.Upper_Inter,
      Level.Advanced,
      Level.Mastery,
    ]),
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

// Query cho GET /admin/words
export const GetWordsAdminQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
    partOfSpeech: z
      .enum([
        PART_OF_SPEECH.NOUN,
        PART_OF_SPEECH.VERB,
        PART_OF_SPEECH.ADJECTIVE,
        PART_OF_SPEECH.ADVERB,
        PART_OF_SPEECH.PRONOUN,
        PART_OF_SPEECH.PREPOSITION,
        PART_OF_SPEECH.CONJUNCTION,
        PART_OF_SPEECH.INTERJECTION,
        PART_OF_SPEECH.DETERMINER,
        PART_OF_SPEECH.NUMERAL,
        PART_OF_SPEECH.PHRASE,
        PART_OF_SPEECH.OTHER,
      ])
      .optional(),
  })
  .strict()

// Shape của một word trong response
export const VocabularyWordAdminSchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  meaningVi: z.string(),
  phoneticUk: z.string().nullable(),
  phoneticUs: z.string().nullable(),
  partOfSpeech: z.enum([
    PART_OF_SPEECH.NOUN,
    PART_OF_SPEECH.VERB,
    PART_OF_SPEECH.ADJECTIVE,
    PART_OF_SPEECH.ADVERB,
    PART_OF_SPEECH.PRONOUN,
    PART_OF_SPEECH.PREPOSITION,
    PART_OF_SPEECH.CONJUNCTION,
    PART_OF_SPEECH.INTERJECTION,
    PART_OF_SPEECH.DETERMINER,
    PART_OF_SPEECH.NUMERAL,
    PART_OF_SPEECH.PHRASE,
    PART_OF_SPEECH.OTHER,
  ]),
  meaningEn: z.string().nullable(),
  exampleEn: z.string().nullable(),
  exampleVi: z.string().nullable(),
  imageUrl: z.string().nullable(),
  audioUrlUk: z.string().nullable(),
  audioUrlUs: z.string().nullable(),
  audioExampleUrl: z.string().nullable(),
  level: z
    .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
    .nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

// Stats object (dùng cho cả inline trong GetWordsAdminRes lẫn GET /admin/words/stats)
export const VocabularyWordsStatsSchema = z.object({
  total: z.number().int(),
  hasAudio: z.number().int(),
  hasImage: z.number().int(),
  hasIpa: z.number().int(),
  byLevel: z.object({
    BEGINNER: z.number().int(),
    ELEMENTARY: z.number().int(),
    INTERMEDIATE: z.number().int(),
    UPPER_INTER: z.number().int(),
    ADVANCED: z.number().int(),
    MASTERY: z.number().int(),
  }),
  byPartOfSpeech: z.record(z.string(), z.number().int()),
})

// Response của GET /admin/words
export const GetWordsAdminResSchema = z.object({
  data: z.array(VocabularyWordAdminSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
  stats: VocabularyWordsStatsSchema,
})

// Body của PATCH /admin/words/:id
export const UpdateVocabularyBodySchema = z
  .object({
    word: z.string().min(1).max(200).optional(),
    phoneticUk: z.string().max(200).nullable().optional(),
    phoneticUs: z.string().max(200).nullable().optional(),
    partOfSpeech: z
      .enum([
        PART_OF_SPEECH.NOUN,
        PART_OF_SPEECH.VERB,
        PART_OF_SPEECH.ADJECTIVE,
        PART_OF_SPEECH.ADVERB,
        PART_OF_SPEECH.PRONOUN,
        PART_OF_SPEECH.PREPOSITION,
        PART_OF_SPEECH.CONJUNCTION,
        PART_OF_SPEECH.INTERJECTION,
        PART_OF_SPEECH.DETERMINER,
        PART_OF_SPEECH.NUMERAL,
        PART_OF_SPEECH.PHRASE,
        PART_OF_SPEECH.OTHER,
      ])
      .optional(),
    meaningVi: z.string().min(1).optional(),
    meaningEn: z.string().nullable().optional(),
    exampleEn: z.string().nullable().optional(),
    exampleVi: z.string().nullable().optional(),
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .nullable()
      .optional(),
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

// Response của DELETE /admin/words/:id
export const DeleteVocabularyResSchema = z.object({
  message: z.string(),
})

export const CreateLearnerListBodySchema = z
  .object({
    topicId: z.string().uuid(),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
  })
  .strict()

export const UpdateLearnerListBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    level: z
      .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
      .optional(),
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

export type UpdateLearnerListBodyType = z.infer<typeof UpdateLearnerListBodySchema>
export type CreateLearnerListBodyType = z.infer<typeof CreateLearnerListBodySchema>

export type GetWordsAdminQueryType = z.infer<typeof GetWordsAdminQuerySchema>
export type UpdateVocabularyBodyType = z.infer<typeof UpdateVocabularyBodySchema>

export type GetListsQueryType = z.infer<typeof GetListsQuerySchema>
export type GetListsResType = z.infer<typeof GetListsResSchema>
export type GetTopicsResType = z.infer<typeof GetTopicsResSchema>
export type CreateVocabularyListBodyType = z.infer<typeof CreateVocabularyListBodySchema>
export type UpdateVocabularyListBodyType = z.infer<typeof UpdateVocabularyListBodySchema>
export type CreateVocabularyBodyType = z.infer<typeof CreateVocabularyBodySchema>
export type ReorderItemsBodyType = z.infer<typeof ReorderItemsBodySchema>
export type SubmitLearningWordBodyType = z.infer<typeof SubmitLearningWordBodySchema>
export type CreateVocabularyTopicBodyType = z.infer<typeof CreateVocabularyTopicBodySchema>
export type UpdateVocabularyTopicBodyType = z.infer<typeof UpdateVocabularyTopicBodySchema>
export type GetLearningProgressOverviewQueryType = z.infer<typeof GetLearningProgressOverviewQuerySchema>
export type SearchVocabularyQueryType = z.infer<typeof SearchVocabularyQuerySchema>
export type AddItemsByIdsBodyType = z.infer<typeof AddItemsByIdsBodySchema>
export type AddNewVocabularyToListBodyType = z.infer<typeof AddNewVocabularyToListBodySchema>

// Query cho GET /vocabularies/words/trash
export const GetDeletedWordsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
  })
  .strict()

// Shape của một word trong trash
export const DeletedVocabularyWordSchema = z.object({
  id: z.string().uuid(),
  word: z.string(),
  meaningVi: z.string(),
  partOfSpeech: z.enum([
    PART_OF_SPEECH.NOUN,
    PART_OF_SPEECH.VERB,
    PART_OF_SPEECH.ADJECTIVE,
    PART_OF_SPEECH.ADVERB,
    PART_OF_SPEECH.PRONOUN,
    PART_OF_SPEECH.PREPOSITION,
    PART_OF_SPEECH.CONJUNCTION,
    PART_OF_SPEECH.INTERJECTION,
    PART_OF_SPEECH.DETERMINER,
    PART_OF_SPEECH.NUMERAL,
    PART_OF_SPEECH.PHRASE,
    PART_OF_SPEECH.OTHER,
  ]),
  level: z
    .enum([Level.Beginner, Level.Elementary, Level.Intermediate, Level.Upper_Inter, Level.Advanced, Level.Mastery])
    .nullable(),
  imageUrl: z.string().nullable(),
  deletedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

// Response của GET /vocabularies/words/trash
export const GetDeletedWordsResSchema = z.object({
  data: z.array(DeletedVocabularyWordSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
})

export type GetDeletedWordsQueryType = z.infer<typeof GetDeletedWordsQuerySchema>
