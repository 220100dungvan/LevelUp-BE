import { ArticleStatus, QuizQuestionType, VoiceType } from '@/common/constants/article.constant'
import { Level } from '@/common/constants/vocabulary.constant'
import { VocabularySchema } from '@/modules/vocabulary/vocabulary.schema'
import z from 'zod'

export const ArticleTopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  updatedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

export const GetArticleTopicsResSchema = z.object({
  data: z.array(ArticleTopicSchema),
})

export const CreateArticleTopicBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
  })
  .strict()

export const UpdateArticleTopicBodySchema = z
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

export const ArticleSchema = z.object({
  id: z.string().uuid(),
  level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]),
  title: z.string(),
  content: z.string(),
  contentVi: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  status: z.enum([ArticleStatus.DRAFT, ArticleStatus.ARCHIVED, ArticleStatus.PUBLISHED]),
  publishedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  audioUrl: z.string().nullable(),
  speechMarks: z.unknown().nullable(),
  voiceType: z.enum([VoiceType.UK_MALE, VoiceType.UK_FEMALE, VoiceType.US_MALE, VoiceType.US_FEMALE]).nullable(),
  readingTimeMin: z.number().int().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  topics: z.array(ArticleTopicSchema).optional(),
})

export const ArticleListItemSchema = z.object({
  id: z.string().uuid(),
  level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]),
  title: z.string(),
  thumbnailUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  status: z.enum([ArticleStatus.DRAFT, ArticleStatus.ARCHIVED, ArticleStatus.PUBLISHED]),
  voiceType: z.enum([VoiceType.UK_MALE, VoiceType.UK_FEMALE, VoiceType.US_MALE, VoiceType.US_FEMALE]).nullable(),
  readingTimeMin: z.number().int().nullable(),
  createdAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
  topics: z.array(ArticleTopicSchema),
})

export const GetArticlesResSchema = z.object({
  data: z.array(ArticleListItemSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

export const GetArticlesQuerySchema = z
  .object({
    // Filter nhiều topic cùng lúc: ?topicIds=id1,id2 hoặc topicIds[]=id1&topicIds[]=id2
    topicIds: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined
        const arr = Array.isArray(val) ? val : val.split(',')
        return arr.map((s) => s.trim()).filter(Boolean)
      }),
    level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]).optional(),
    status: z.enum([ArticleStatus.DRAFT, ArticleStatus.ARCHIVED, ArticleStatus.PUBLISHED]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(24),
  })
  .strict()

export const QuizOptionSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  text: z.string(),
  textVi: z.string().nullable(),
  isCorrect: z.boolean(),
  orderIndex: z.number().int(),
})

export const QuizOptionPublicSchema = QuizOptionSchema.omit({
  isCorrect: true,
  textVi: true,
})

export const QuizQuestionSchema = z.object({
  id: z.string().uuid(),
  articleId: z.string().uuid(),
  questionText: z.string(),
  questionTextVi: z.string().nullable(),
  types: z.array(
    z.enum([
      QuizQuestionType.MAIN_IDEA,
      QuizQuestionType.DETAIL,
      QuizQuestionType.INFERENCE,
      QuizQuestionType.VOCABULARY,
      QuizQuestionType.REFERENCE,
      QuizQuestionType.PURPOSE_TONE,
      QuizQuestionType.NOT_EXCEPT,
      QuizQuestionType.SUMMARY,
    ]),
  ),
  evidenceText: z.string().nullable(),
  evidenceTextVi: z.string().nullable(),
  explanation: z.string().nullable(),
  orderIndex: z.number().int(),
  options: z.array(QuizOptionSchema),
})

export const QuizQuestionPublicSchema = QuizQuestionSchema.omit({
  questionTextVi: true,
  evidenceText: true,
  evidenceTextVi: true,
  explanation: true,
}).extend({
  options: z.array(QuizOptionPublicSchema),
})

export const VocabularyWithAntonymAndSynonymSchema = VocabularySchema.extend({
  hasSynonyms: z.array(z.object({ id: z.string().uuid(), word: z.string() })),
  hasAntonyms: z.array(z.object({ id: z.string().uuid(), word: z.string() })),
})

export const QuizOptionAccessibleSchema = QuizOptionSchema.extend({
  textVi: z.string().nullable().optional(),
  isCorrect: z.boolean().optional(),
})

export const QuizQuestionAccessibleSchema = QuizQuestionSchema.extend({
  questionTextVi: z.string().nullable().optional(),
  evidenceText: z.string().nullable().optional(),
  evidenceTextVi: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  options: z.array(QuizOptionAccessibleSchema),
})

export const GetArticleVocabulariesResSchema = z.object({
  data: z.array(VocabularyWithAntonymAndSynonymSchema),
})

export const QuizAttemptResultSchema = z
  .object({
    question: z.object({
      questionId: z.string().uuid(),
      questionText: z.string(),
      questionTextVi: z.string().nullable(),
      evidenceText: z.string().nullable(),
      evidenceTextVi: z.string().nullable(),
      explanation: z.string().nullable(),
    }),
    options: z.array(QuizOptionSchema.pick({ id: true, text: true, textVi: true })),
    selectedOptionId: z.string().uuid().nullable(),
    correctOptionId: z.string().uuid(),
    isCorrect: z.boolean(),
  })
  .strict()

export const QuizAttemptSchema = z.object({
  attemptId: z.number().int(),
  totalQuestions: z.number().int(),
  correctCount: z.number().int(),
  finishedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()).nullable(),
  answerLogs: z.array(QuizAttemptResultSchema),
})

export const GetArticleQuizResSchema = z.object({
  data: z.array(QuizQuestionAccessibleSchema),
})

export const GetArticleQuizAttemptResSchema = QuizAttemptSchema

export const GetAllArticleQuizAttemptsResSchema = z.object({
  data: z.array(QuizAttemptSchema.omit({ answerLogs: true })),
})

export const StartArticleQuizResSchema = z.object({
  attemptId: z.number().int(),
  quizQuestions: z.array(QuizQuestionAccessibleSchema),
  startedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

export const SubmitArticleQuizAnswerSchema = z
  .object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string().uuid().nullable().optional().default(null),
  })
  .strict()

export const SubmitArticleQuizBodySchema = z
  .object({
    attemptId: z.coerce.number().int().positive(),
    answers: z.array(SubmitArticleQuizAnswerSchema).optional().default([]),
  })
  .strict()
  .superRefine(({ answers }, ctx) => {
    const seenQuestionIds = new Set<string>()
    for (let i = 0; i < answers.length; i++) {
      const qid = answers[i].questionId
      if (seenQuestionIds.has(qid)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Mỗi questionId chỉ được xuất hiện 1 lần',
          path: ['answers', i, 'questionId'],
        })
      }
      seenQuestionIds.add(qid)
    }
  })

export const SubmitArticleQuizAnswerResultSchema = z
  .object({
    question: z.object({
      questionId: z.string().uuid(),
      questionTextVi: z.string().nullable(),
      evidenceText: z.string().nullable(),
      evidenceTextVi: z.string().nullable(),
      explanation: z.string().nullable(),
    }),
    options: z.array(QuizOptionSchema.pick({ id: true, text: true, textVi: true })),
    selectedOptionId: z.string().uuid().nullable(),
    correctOptionId: z.string().uuid(),
    isCorrect: z.boolean(),
  })
  .strict()

export const SubmitArticleQuizResSchema = z
  .object({
    attemptId: z.number().int(),
    totalQuestions: z.number().int(),
    correctCount: z.number().int(),
    scorePct: z.number().min(0).max(100),
    finishedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
    results: z.array(SubmitArticleQuizAnswerResultSchema),
  })
  .strict()

export const GetArticleContentResSchema = ArticleSchema

export const ArticleProgressBodySchema = z
  .object({
    progressPct: z.number().min(0).max(100),
    completed: z.boolean().optional(),
  })
  .strict()

export const ArticleProgressResSchema = z.object({
  message: z.string(),
  progressPct: z.number(),
  completed: z.boolean(),
})

export const UpdateArticleBodySchema = z
  .object({
    level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]).optional(),
    title: z.string().min(1).max(500).optional(),
    content: z.string().min(1).optional(),
    contentVi: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    audioUrl: z.string().url().optional(),
    voiceType: z.enum([VoiceType.UK_FEMALE, VoiceType.UK_MALE, VoiceType.US_FEMALE, VoiceType.US_MALE]).optional(),
    readingTimeMin: z.preprocess((value) => {
      if (value === '' || value === undefined || value === null) return undefined
      return value
    }, z.coerce.number().int().positive().optional()),
    status: z.enum([ArticleStatus.DRAFT, ArticleStatus.ARCHIVED, ArticleStatus.PUBLISHED]).optional(),
    topicIds: z.preprocess((value: unknown) => {
      if (Array.isArray(value)) return value as unknown
      if (typeof value !== 'string') return value

      const trimmed = value.trim()
      if (!trimmed) return undefined as unknown

      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed as unknown
      } catch {
        // Fall back to comma-separated parsing.
      }

      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }, z.array(z.string().uuid()).min(1).optional()),
  })
  .strict()

export const CreateQuizOptionSchema = z.object({
  text: z.string().min(1),
  textVi: z.string().optional(),
  isCorrect: z.boolean(),
  orderIndex: z.number().int().min(0).optional(),
})

export const UpdateQuizOptionSchema = CreateQuizOptionSchema

export const CreateQuizQuestionSchema = z
  .object({
    questionText: z.string().min(1),
    questionTextVi: z.string().optional(),
    types: z
      .array(
        z.enum([
          QuizQuestionType.MAIN_IDEA,
          QuizQuestionType.DETAIL,
          QuizQuestionType.INFERENCE,
          QuizQuestionType.VOCABULARY,
          QuizQuestionType.REFERENCE,
          QuizQuestionType.PURPOSE_TONE,
          QuizQuestionType.NOT_EXCEPT,
          QuizQuestionType.SUMMARY,
        ]),
      )
      .min(1),
    evidenceText: z.string().optional(),
    evidenceTextVi: z.string().optional(),
    explanation: z.string().optional(),
    orderIndex: z.number().int().min(0).optional(),
    options: z.array(CreateQuizOptionSchema).length(4),
  })
  .strict()
  .superRefine(({ options }, ctx) => {
    const correctCount = options.filter((o) => o.isCorrect).length
    if (correctCount !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mỗi câu hỏi phải có đúng 1 đáp án đúng',
        path: ['options'],
      })
    }
  })

export const CreateArticleVocabularySchema = z
  .object({
    word: z.string().min(1),
    phoneticUk: z.string().optional(),
    phoneticUs: z.string().optional(),
    partOfSpeech: z.string().optional(),
    meaningVi: z.string().min(1),
    meaningEn: z.string().optional(),
    exampleEn: z.string().optional(),
    exampleVi: z.string().optional(),
    imageUrl: z.string().url().optional(),
    audioUrlUk: z.string().url().optional(),
    audioUrlUs: z.string().url().optional(),
    audioExampleUrl: z.string().url().optional(),
    level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]).optional(),
    synonymIds: z.array(z.string().uuid()).optional().default([]),
    antonymIds: z.array(z.string().uuid()).optional().default([]),
  })
  .strict()

export const CreateArticleBodySchema = z
  .object({
    level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]),
    title: z.string().min(1).max(500),
    content: z.string().min(1),
    contentVi: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    voiceType: z.enum([VoiceType.UK_FEMALE, VoiceType.UK_MALE, VoiceType.US_FEMALE, VoiceType.US_MALE]).optional(),
    readingTimeMin: z.preprocess((value) => {
      if (value === '' || value === undefined || value === null) return undefined
      return value
    }, z.coerce.number().int().positive().optional()),
    status: z
      .enum([ArticleStatus.DRAFT, ArticleStatus.ARCHIVED, ArticleStatus.PUBLISHED])
      .optional()
      .default(ArticleStatus.DRAFT),
    topicIds: z.preprocess(
      (value: unknown) => {
        if (Array.isArray(value)) return value as unknown
        if (typeof value !== 'string') return value

        const trimmed = value.trim()
        if (!trimmed) return [] as unknown

        try {
          const parsed: unknown = JSON.parse(trimmed)
          if (Array.isArray(parsed)) return parsed as unknown
        } catch {
          // Fall back to comma-separated parsing.
        }

        return trimmed
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      },
      z.array(z.string().uuid()).min(1, 'Phải có ít nhất 1 topic'),
    ),
  })
  .strict()

export const CreateArticleVocabulariesBodySchema = z
  .object({
    vocabularies: z.array(CreateArticleVocabularySchema).min(1),
  })
  .strict()

export const CreateArticleResSchema = z.object({
  articleId: z.string().uuid(),
  message: z.string(),
  audioUrl: z.string().url(),
})

export const CreateQuizBodySchema = z
  .object({
    questions: z.array(CreateQuizQuestionSchema).min(1),
  })
  .strict()

export const UpdateQuizQuestionSchema = z
  .object({
    questionText: z.string().min(1).optional(),
    questionTextVi: z.string().optional(),
    types: z
      .array(
        z.enum([
          QuizQuestionType.MAIN_IDEA,
          QuizQuestionType.DETAIL,
          QuizQuestionType.INFERENCE,
          QuizQuestionType.VOCABULARY,
          QuizQuestionType.REFERENCE,
          QuizQuestionType.PURPOSE_TONE,
          QuizQuestionType.NOT_EXCEPT,
          QuizQuestionType.SUMMARY,
        ]),
      )
      .min(1)
      .optional(),
    evidenceText: z.string().optional(),
    evidenceTextVi: z.string().optional(),
    explanation: z.string().optional(),
    orderIndex: z.number().int().min(0).optional(),
    options: z.array(UpdateQuizOptionSchema).length(4).optional(),
  })
  .strict()
  .superRefine(({ options }, ctx) => {
    if (!options) return

    const correctCount = options.filter((option) => option.isCorrect).length
    if (correctCount !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mỗi câu hỏi phải có đúng 1 đáp án đúng',
        path: ['options'],
      })
    }
  })

export type GetArticlesQueryType = z.infer<typeof GetArticlesQuerySchema>
export type ArticleProgressBodyType = z.infer<typeof ArticleProgressBodySchema>
export type UpdateArticleBodyType = z.infer<typeof UpdateArticleBodySchema>
export type CreateArticleBodyType = z.infer<typeof CreateArticleBodySchema>
export type CreateArticleVocabulariesBodyType = z.infer<typeof CreateArticleVocabulariesBodySchema>
export type CreateQuizBodyType = z.infer<typeof CreateQuizBodySchema>
export type CreateArticleResType = z.infer<typeof CreateArticleResSchema>
export type CreateQuizQuestionType = z.infer<typeof CreateQuizQuestionSchema>
export type CreateArticleVocabularyType = z.infer<typeof CreateArticleVocabularySchema>
export type UpdateQuizOptionType = z.infer<typeof UpdateQuizOptionSchema>
export type UpdateQuizQuestionType = z.infer<typeof UpdateQuizQuestionSchema>
export type StartArticleQuizResType = z.infer<typeof StartArticleQuizResSchema>
export type SubmitArticleQuizBodyType = z.infer<typeof SubmitArticleQuizBodySchema>
export type SubmitArticleQuizResType = z.infer<typeof SubmitArticleQuizResSchema>
export type QuizAttemptResultType = z.infer<typeof QuizAttemptResultSchema>
export type QuizAttemptLastType = z.infer<typeof QuizAttemptSchema>
export type GetArticleQuizAttemptResType = z.infer<typeof GetArticleQuizAttemptResSchema>
export type GetAllArticleQuizAttemptsResType = z.infer<typeof GetAllArticleQuizAttemptsResSchema>
export type CreateArticleTopicBodyType = z.infer<typeof CreateArticleTopicBodySchema>
export type UpdateArticleTopicBodyType = z.infer<typeof UpdateArticleTopicBodySchema>
