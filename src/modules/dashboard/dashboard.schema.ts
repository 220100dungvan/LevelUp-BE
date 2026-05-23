import z from 'zod'

export const TodayProgressResSchema = z.object({
  wordsLearned: z.number().int(), // words learned today
  wordsReviewed: z.number().int(), // words reviewed today
  dailyGoal: z.number().int(), // target words per day (from UserStat or config)
  progressPct: z.number(), // 0-100
  lessonsCompleted: z.number().int(), // learning sessions finished today
  streak: z.number().int(), // learning streak in days
})

export const BreakdownItemSchema = z.object({
  key: z.enum(['dictation', 'shadowing', 'vocabulary', 'reading']),
  label: z.string(), // display label
  value: z.number().int(), // dictation/shadowing: sentences; vocab: words; reading: articles
  unit: z.string(), // "sentences" | "words" | "articles"
})

export const BreakdownResSchema = z.object({
  items: z.array(BreakdownItemSchema),
})

export const WeeklyDaySchema = z.object({
  date: z.string(), // "YYYY-MM-DD"
  label: z.string(), // "Mon" … "Sun"
  wordsLearned: z.number().int(),
  sentencesPracticed: z.number().int(), // dictation + shadowing sentences
})

export const WeeklyActivityResSchema = z.object({
  days: z.array(WeeklyDaySchema),
  avgWordsPerDay: z.number(),
  avgSentencesPerDay: z.number(),
})

export type TodayProgressResType = z.infer<typeof TodayProgressResSchema>
export type BreakdownItemType = z.infer<typeof BreakdownItemSchema>
export type BreakdownResType = z.infer<typeof BreakdownResSchema>
export type WeeklyActivityResType = z.infer<typeof WeeklyActivityResSchema>
