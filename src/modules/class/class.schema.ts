import { ClassRole } from '@/common/constants/class.constant'
import { Level } from '@/common/constants/vocabulary.constant'
import z from 'zod'

const UserSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  email: z.string().email(),
})

export const ClassSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  inviteCode: z.string(),
  imageUrl: z.union([z.string().url(), z.literal(''), z.null()]),
  teacher: UserSummarySchema,
  totalMembers: z.number().int(),
  createdAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
})

export const GetOverviewMyClassesResSchema = z.object({
  classes: z.array(ClassSchema),
  totalVocabularyLists: z.number().int(),
})

export const ClassOverviewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  totalMembers: z.number().int(),
  teacher: UserSummarySchema,
  isAlreadyMember: z.boolean(),
})

const VocabularyListSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.enum([Level.Beginner, Level.Intermediate, Level.Advanced]).nullable(),
  isPublic: z.boolean(),
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

export const ClassDetailSchema = ClassSchema.extend({
  members: z.array(
    z.object({
      id: z.number(),
      role: z.enum([ClassRole.STUDENT, ClassRole.ASSISTANT]),
      joinedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
      user: UserSummarySchema,
    }),
  ),
  vocabLists: z.array(
    VocabularyListSummarySchema.extend({
      assignedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
    }),
  ),
})

export const CreateClassResSchema = ClassSchema.omit({
  teacher: true,
  totalMembers: true,
})

export const CreateClassBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
  })
  .strict()

export const UpdateClassBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
    inviteCode: z.string().optional(),
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

export const UpdateClassResSchema = CreateClassResSchema

export const AddMembersBodySchema = z
  .object({
    emails: z.array(z.string().email()).min(1).max(50),
    role: z.enum([ClassRole.STUDENT, ClassRole.ASSISTANT]).optional(),
  })
  .strict()

export const AddMembersResSchema = z.object({
  added: z.number().int(),
  skipped: z.number().int(),
  notFound: z.array(z.string().email()),
})

export const TransferMemberBodySchema = z
  .object({
    targetClassId: z.string().uuid(),
  })
  .strict()

export const AssignVocabListBodySchema = z
  .object({
    listIds: z.array(z.string().uuid()).min(1),
  })
  .strict()

export const AssignVocabListResSchema = z.object({
  assigned: z.number().int(),
  skipped: z.number().int(),
})

export const GetClassVocabListsResSchema = z.object({
  data: z.array(
    VocabularyListSummarySchema.extend({
      assignedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
    }),
  ),
})

export const MemberProgressSummarySchema = z.object({
  user: UserSummarySchema,
  role: z.enum([ClassRole.STUDENT, ClassRole.ASSISTANT]),
  totalListsAssigned: z.number().int(),
  listsCompleted: z.number().int(),
  overallProgressPct: z.number(),
  totalWordsLearned: z.number().int(),
  learningStreak: z.number().int(),
  lastLearnDate: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()).nullable(),
})

export const GetClassStatisticsResSchema = z.object({
  class: z.object({
    id: z.string().uuid(),
    name: z.string(),
    totalMembers: z.number().int(),
    totalListsAssigned: z.number().int(),
  }),
  members: z.array(MemberProgressSummarySchema),
})

const VocabProgressDetailSchema = z.object({
  vocabularyId: z.string().uuid(),
  word: z.string(),
  status: z.string(),
  correctCount: z.number().int(),
  wrongCount: z.number().int(),
  lastReviewedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()).nullable(),
})

const ListProgressDetailSchema = z.object({
  listId: z.string().uuid(),
  listName: z.string(),
  totalWords: z.number().int(),
  learnedWords: z.number().int(),
  progressPct: z.number(),
  completed: z.boolean(),
  lastLearnedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()).nullable(),
  wordDetails: z.array(VocabProgressDetailSchema),
})

export const GetMemberProgressResSchema = z.object({
  user: UserSummarySchema.optional(),
  lists: z.array(ListProgressDetailSchema),
})

export const GetClassMembersResSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      role: z.enum([ClassRole.STUDENT, ClassRole.ASSISTANT]),
      joinedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
      user: UserSummarySchema,
      progressPct: z.number().nullable(),
    }),
  ),
})

export const GetClassMaterialsResSchema = z.object({
  data: z.array(
    VocabularyListSummarySchema.extend({
      assignedAt: z.preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime()),
      userProgress: z
        .object({
          progressPct: z.number(),
          completed: z.boolean(),
          lastLearnedAt: z
            .preprocess((v) => (v instanceof Date ? v.toISOString() : v), z.string().datetime())
            .nullable(),
        })
        .nullable(),
    }),
  ),
})

export type CreateClassBodyType = z.infer<typeof CreateClassBodySchema>
export type UpdateClassBodyType = z.infer<typeof UpdateClassBodySchema>
export type AddMembersBodyType = z.infer<typeof AddMembersBodySchema>
export type TransferMemberBodyType = z.infer<typeof TransferMemberBodySchema>
export type AssignVocabListBodyType = z.infer<typeof AssignVocabListBodySchema>
