import z from 'zod'
import {
  FinishSessionResSchema,
  StartSessionBodySchema,
  StartSessionResSchema,
} from '@/modules/video-session/video-session.schema'
export { StartSessionBodySchema, StartSessionResSchema, FinishSessionResSchema }

export const SubmitShadowingBodySchema = z.object({
  sessionId: z.coerce.number().int(),
  sentenceId: z.coerce.number().int(),
})

export const WordFeedbackSchema = z.object({
  word: z.string(),
  status: z.enum(['correct', 'wrong', 'missing', 'extra']),
})

export const SubmitShadowingResSchema = z.object({
  score: z.number().min(0).max(100),
  transcribedText: z.string(),
  feedbackJson: z.array(WordFeedbackSchema),
  audioUrl: z.string(),
})

export type SubmitShadowingBodyType = z.infer<typeof SubmitShadowingBodySchema>
export type SubmitShadowingResType = z.infer<typeof SubmitShadowingResSchema>
