import OTPEmail from '@/common/emails/templates/otp'
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import * as React from 'react'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { EMAIL_QUEUE, EmailJob, SendOTPJobPayload } from '@/common/emails/email.job'
import { Resend } from 'resend'
import envConfig from '@/common/utils/config'

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
