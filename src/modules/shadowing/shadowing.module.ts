import { Module } from '@nestjs/common'
import { ShadowingController } from './shadowing.controller'
import { ShadowingService } from './shadowing.service'
import { VideoSessionModule } from '@/modules/video-session/video-session.module'
import { VideoModule } from '@/modules/video/video.module'
import { ShadowingRepository } from '@/modules/shadowing/shadowing.repo'

@Module({
  imports: [VideoSessionModule, VideoModule],
  controllers: [ShadowingController],
  providers: [ShadowingService, ShadowingRepository],
})
export class ShadowingModule {}
