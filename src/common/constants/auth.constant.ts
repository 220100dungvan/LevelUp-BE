export const REQUEST_USER_KEY = 'user'
export const AUTH_TYPE_KEY = 'authType'
export const ROLES_TYPE_KEY = 'roles'

export const AuthType = {
  Bearer: 'Bearer',
  None: 'None',
  APIKey: 'APIKey',
  DictionaryAPIKey: 'DictionaryAPIKey',
} as const

export type AuthTypeEnum = (typeof AuthType)[keyof typeof AuthType]

export const ConditionGuard = {
  And: 'and',
  Or: 'or',
} as const

export type ConditionGuardType = (typeof ConditionGuard)[keyof typeof ConditionGuard]

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED',
} as const

export const TypeOfVerificationCode = {
  REGISTER: 'REGISTER',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  LOGIN: 'LOGIN',
  DISABLE_2FA: 'DISABLE_2FA',
} as const

export type TypeOfVerificationCodeType = (typeof TypeOfVerificationCode)[keyof typeof TypeOfVerificationCode]

export const UserRole = {
  LEARNER: 'LEARNER',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]
