import z from 'zod'
import {
  StartSessionBodySchema,
  StartSessionResSchema,
  FinishSessionResSchema,
} from '@/modules/video-session/video-session.schema'
// Re-export chung để DictationController dùng
export { StartSessionBodySchema, StartSessionResSchema, FinishSessionResSchema }

export const SubmitDictationBodySchema = z
  .object({
    data: z.string().min(1), // JWT token chứa dictation submission data
  })
  .strict()

export const DictationResultItemSchema = z.object({
  id: z.number().int(),
  sessionId: z.number().int(),
  sentenceId: z.number().int(),
  userText: z.string().nullable(),
  correctCount: z.number().int(),
  wrongCount: z.number().int(),
  isRevealed: z.boolean(),
  createdAt: z.date(),
})

export const SubmitDictationResSchema = z.object({
  isCorrect: z.boolean(),
  correctnessPercentage: z.number().min(0).max(100),
  submittedResults: z.array(DictationResultItemSchema), // tất cả câu đã submit trong session
})

export type SubmitDictationBodyType = z.infer<typeof SubmitDictationBodySchema>
export type SubmitDictationResType = z.infer<typeof SubmitDictationResSchema>
export type DictationResultItem = z.infer<typeof DictationResultItemSchema>
