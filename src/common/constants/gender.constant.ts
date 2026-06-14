export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const

export type GenderType = (typeof GENDER)[keyof typeof GENDER]
