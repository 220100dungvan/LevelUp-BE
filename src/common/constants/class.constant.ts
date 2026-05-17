export const ClassRole = {
  STUDENT: 'STUDENT',
  ASSISTANT: 'ASSISTANT',
} as const

export type ClassRoleType = (typeof ClassRole)[keyof typeof ClassRole]
