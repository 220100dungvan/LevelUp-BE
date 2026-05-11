export const ArticleStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type ArticleStatusType = (typeof ArticleStatus)[keyof typeof ArticleStatus]

export const VoiceType = {
  UK_MALE: 'UK_MALE',
  UK_FEMALE: 'UK_FEMALE',
  US_MALE: 'US_MALE',
  US_FEMALE: 'US_FEMALE',
} as const

export type VoiceTypeType = (typeof VoiceType)[keyof typeof VoiceType]

export const QuizQuestionType = {
  MAIN_IDEA: 'MAIN_IDEA',
  DETAIL: 'DETAIL',
  INFERENCE: 'INFERENCE',
  VOCABULARY: 'VOCABULARY',
  REFERENCE: 'REFERENCE',
  PURPOSE_TONE: 'PURPOSE_TONE',
  NOT_EXCEPT: 'NOT_EXCEPT',
  SUMMARY: 'SUMMARY',
} as const

export type QuizQuestionTypeType = (typeof QuizQuestionType)[keyof typeof QuizQuestionType]
