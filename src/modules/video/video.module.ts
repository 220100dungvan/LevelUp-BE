import { Module } from '@nestjs/common'
import { VideoController } from './video.controller'
import { VideoService } from './video.service'
import { VideoRepository } from '@/modules/video/video.repo'

@Module({
  controllers: [VideoController],
  providers: [VideoService, VideoRepository],
  exports: [VideoRepository],
})
export class VideoModule {}
