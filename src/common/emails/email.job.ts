export const EMAIL_QUEUE = 'email'

export const EmailJob = {
  SEND_OTP: 'send-otp',
} as const

export type SendOTPJobPayload = {
  email: string
  code: string
}
