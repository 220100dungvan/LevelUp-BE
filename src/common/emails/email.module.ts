import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { EmailService } from '@/common/emails/email.service'
import { EmailConsumer } from '@/common/emails/email.consumer'
import { EMAIL_QUEUE } from '@/common/emails/email.job'

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [EmailService, EmailConsumer],
  exports: [EmailService],
})
export class EmailModule {}
