import z from 'zod'
import {
  StartSessionBodySchema,
  StartSessionResSchema,
  FinishSessionResSchema,
} from '@/modules/video-session/video-session.schema'
// Re-export chung để DictationController dùng
export { StartSessionBodySchema, StartSessionResSchema, FinishSessionResSchema }

export const WordDiffSchema = z.object({
  word: z.string(),
  status: z.enum(['correct', 'wrong', 'missing', 'extra']),
})

export const SubmitDictationBodySchema = z
  .object({
    sessionId: z.number().int(),
    sentenceId: z.number().int(),
    userText: z.string().min(1),
  })
  .strict()

export const SubmitDictationResSchema = z.object({
  isCorrect: z.boolean(),
  correctnessPercentage: z.number().min(0).max(100),
  diff: z.array(WordDiffSchema),
  correctContent: z.string(), // câu gốc gửi về để FE hiển thị
})

export type SubmitDictationBodyType = z.infer<typeof SubmitDictationBodySchema>
export type SubmitDictationResType = z.infer<typeof SubmitDictationResSchema>
