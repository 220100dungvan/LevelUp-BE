import OTPEmail from '@/common/emails/templates/otp'
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import * as React from 'react'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import {
  EMAIL_QUEUE,
  EmailJob,
  SendOTPJobPayload,
  StreakAtRiskJobPayload,
  StreakComebackJobPayload,
} from '@/common/emails/email.job'
import { Resend } from 'resend'
import envConfig from '@/common/utils/config'
import StreakAtRiskEmail from '@/common/emails/templates/streak-at-risk-email'
import StreakComebackEmail from '@/common/emails/templates/streak-comeback-email'

@Processor(EMAIL_QUEUE)
export class EmailConsumer extends WorkerHost {
  private readonly logger = new Logger(EmailConsumer.name)
  private readonly resend = new Resend(envConfig.RESEND_API_KEY)

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job [${job.name}] id=${job.id}`)

    switch (job.name) {
      case EmailJob.SEND_OTP:
        await this.handleSendOTP(job as Job<SendOTPJobPayload>)
        break
      case EmailJob.STREAK_AT_RISK:
        await this.handleStreakAtRisk(job as Job<StreakAtRiskJobPayload>)
        break
      case EmailJob.STREAK_COMEBACK:
        await this.handleStreakComeback(job as Job<StreakComebackJobPayload>)
        break
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleSendOTP(job: Job<SendOTPJobPayload>) {
    const { email, code } = job.data
    const subject = 'Mã OTP'

    const { error } = await this.resend.emails.send({
      from: `${envConfig.APP_NAME} <${envConfig.EMAIL_FROM}>`,
      to: email,
      subject,
      react: <OTPEmail otpCode={code} title={subject} />,
    })

    if (error) {
      throw new Error(`Failed to send OTP email to ${email}: ${error.message}`)
    }

    this.logger.log(`OTP sent successfully to ${email}`)
  }

  private async handleStreakAtRisk(job: Job<StreakAtRiskJobPayload>) {
    const { email, name, streak } = job.data
    const subject = `🔥 Streak ${streak} ngày của bạn sắp bị mất!`
    const { error } = await this.resend.emails.send({
      from: `${envConfig.APP_NAME} <${envConfig.EMAIL_FROM}>`,
      to: email,
      subject,
      react: <StreakAtRiskEmail name={name} streak={streak} />,
    })
    if (error) throw new Error(`Failed to send streak-at-risk to ${email}: ${error.message}`)
    this.logger.log(`Streak-at-risk email sent to ${email}`)
  }

  private async handleStreakComeback(job: Job<StreakComebackJobPayload>) {
    const { email, name, daysMissed } = job.data
    const subject = `Đã lâu rồi chúng tôi không thấy bạn 😢`
    const { error } = await this.resend.emails.send({
      from: `${envConfig.APP_NAME} <${envConfig.EMAIL_FROM}>`,
      to: email,
      subject,
      react: <StreakComebackEmail name={name} daysMissed={daysMissed} />,
    })
    if (error) throw new Error(`Failed to send comeback email to ${email}: ${error.message}`)
    this.logger.log(`Comeback email sent to ${email}`)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job [${job.name}] id=${job.id} completed`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job [${job.name}] id=${job.id} failed: ${error.message}`)
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job [${job.name}] id=${job.id} started (attempt ${job.attemptsMade + 1})`)
  }
}
