import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import * as React from 'react'
import envConfig from '@/common/utils/config'
import OTPEmail from '@/common/emails/templates/otp'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'
    return this.resend.emails.send({
      from: 'LevelUp <onboarding@miustore.io.vn>',
      to: [payload.email],
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />,
    })
  }
}
