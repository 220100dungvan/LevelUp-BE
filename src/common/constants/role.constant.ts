export const RoleName = {
  Admin: 'ADMIN',
  Learner: 'LEARNER',
  Teacher: 'TEACHER',
} as const

export type RoleNameType = (typeof RoleName)[keyof typeof RoleName]
