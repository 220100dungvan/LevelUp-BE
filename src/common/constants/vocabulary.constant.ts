export const VocabStatus = {
  New: 'NEW',
  Easy: 'EASY',
  Medium: 'MEDIUM',
  Hard: 'HARD',
  Mastered: 'MASTERED',
} as const

export type VocabStatusType = (typeof VocabStatus)[keyof typeof VocabStatus]

export const VOCAB_REVIEW_INTERVAL_DAYS: Record<VocabStatusType, number> = {
  [VocabStatus.New]: 0,
  [VocabStatus.Easy]: 7,
  [VocabStatus.Medium]: 3,
  [VocabStatus.Hard]: 1,
  [VocabStatus.Mastered]: 30,
}

export const Level = {
  Beginner: 'BEGINNER',
  Elementary: 'ELEMENTARY',
  Intermediate: 'INTERMEDIATE',
  Upper_Inter: 'UPPER_INTER',
  Advanced: 'ADVANCED',
  Mastery: 'MASTERY',
} as const

export type LevelType = (typeof Level)[keyof typeof Level]

export const PART_OF_SPEECH = {
  NOUN: 'NOUN',
  VERB: 'VERB',
  ADJECTIVE: 'ADJECTIVE',
  ADVERB: 'ADVERB',
  PRONOUN: 'PRONOUN',
  PREPOSITION: 'PREPOSITION',
  CONJUNCTION: 'CONJUNCTION',
  INTERJECTION: 'INTERJECTION',
  DETERMINER: 'DETERMINER',
  NUMERAL: 'NUMERAL',
  PHRASE: 'PHRASE',
  OTHER: 'OTHER',
} as const

export type PartOfSpeechType = (typeof PART_OF_SPEECH)[keyof typeof PART_OF_SPEECH]
