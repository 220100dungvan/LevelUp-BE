export const EMAIL_QUEUE = 'email'

export const EmailJob = {
  SEND_OTP: 'send-otp',
  STREAK_AT_RISK: 'streak-at-risk', // chưa học hôm nay, sắp mất streak
  STREAK_COMEBACK: 'streak-comeback', // bỏ học >= 2 ngày
} as const

export type SendOTPJobPayload = {
  email: string
  code: string
}

export type StreakAtRiskJobPayload = {
  email: string
  name: string
  streak: number // streak hiện tại (> 0)
}

export type StreakComebackJobPayload = {
  email: string
  name: string
  daysMissed: number // bỏ bao nhiêu ngày
}
