import z from 'zod'

export const StartSessionBodySchema = z
  .object({
    videoId: z.string().uuid(),
    mode: z.enum(['DICTATION', 'SHADOWING']),
  })
  .strict()

export const StartSessionResSchema = z.object({
  sessionId: z.number().int(),
  isResumed: z.boolean(),
  /**
   * Danh sách sentenceId đã hoàn thành — FE dùng để skip các câu đó khi resume.
   * Với Dictation: id các câu đã có DictationResult
   * Với Shadowing: id các câu đã có ShadowingResult
   */
  completedSentenceIds: z.array(z.number().int()),
})

export const FinishSessionResSchema = z.object({
  sessionId: z.number().int(),
  mode: z.enum(['DICTATION', 'SHADOWING']),
  totalSentences: z.number().int(),
  correctCount: z.number().int(),
  wrongCount: z.number().int(),
  /**
   * Dictation: % câu đúng hoàn toàn
   * Shadowing: điểm trung bình
   */
  accuracyPct: z.number(),
  durationSec: z.number().int(),
  finishedAt: z.preprocess((val) => (val instanceof Date ? val.toISOString() : val), z.string().datetime()),
})

export type StartSessionBodyType = z.infer<typeof StartSessionBodySchema>
export type StartSessionResType = z.infer<typeof StartSessionResSchema>
export type FinishSessionResType = z.infer<typeof FinishSessionResSchema>
