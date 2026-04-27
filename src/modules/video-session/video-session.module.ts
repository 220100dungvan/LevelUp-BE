import { Module } from '@nestjs/common'
import { VideoSessionService } from './video-session.service'
import { VideoSessionRepository } from '@/modules/video-session/video-session.repo'
import { VideoModule } from '@/modules/video/video.module'

@Module({
  imports: [VideoModule],
  providers: [VideoSessionService, VideoSessionRepository],
  exports: [VideoSessionRepository, VideoSessionService],
})
export class VideoSessionModule {}
