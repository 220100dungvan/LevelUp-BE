import { Module } from '@nestjs/common'
import { SpeakingController } from './speaking.controller'
import { SpeakingService } from './speaking.service'
import { SpeakingRepository } from '@/modules/speaking/speaking.repo'
import { SpeakingGateway } from '@/modules/speaking/speaking.gateway'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [UserModule],
  controllers: [SpeakingController],
  providers: [SpeakingService, SpeakingRepository, SpeakingGateway],
})
export class SpeakingModule {}
