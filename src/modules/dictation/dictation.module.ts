import { Module } from '@nestjs/common'
import { DictationController } from './dictation.controller'
import { DictationService } from './dictation.service'
import { DictationRepository } from '@/modules/dictation/dictation.repo'
import { VideoModule } from '@/modules/video/video.module'
import { VideoSessionModule } from '@/modules/video-session/video-session.module'

@Module({
  imports: [VideoSessionModule, VideoModule],
  controllers: [DictationController],
  providers: [DictationService, DictationRepository],
})
export class DictationModule {}
