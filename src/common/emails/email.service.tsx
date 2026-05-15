import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { EMAIL_QUEUE, EmailJob, SendOTPJobPayload } from '@/common/emails/email.job'

@Injectable()
export class EmailService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async sendOTP(payload: SendOTPJobPayload) {
    await this.emailQueue.add(EmailJob.SEND_OTP, payload, {
      attempts: 3, // retry tối đa 3 lần nếu thất bại
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
      priority: 1,
    })
  }
}
