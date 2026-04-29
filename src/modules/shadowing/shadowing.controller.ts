import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { audioFileInterceptor } from '@/common/interceptors/audio-file.interceptor'
import { requiredAudioFileValidationPipe } from '@/common/pipes/audio-file-validation.pipe'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'
import {
  StartSessionBodyDTO,
  StartSessionResDTO,
  SubmitShadowingBodyDTO,
  SubmitShadowingResDTO,
} from '@/modules/shadowing/shadowing.dto'
import { ShadowingService } from '@/modules/shadowing/shadowing.service'
import { VideoSessionService } from '@/modules/video-session/video-session.service'
import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('shadowing')
export class ShadowingController {
  constructor(
    private readonly shadowingService: ShadowingService,
    private readonly sessionService: VideoSessionService,
  ) {}

  @Post('session/start')
  @ZodResponse({ type: StartSessionResDTO })
  startSession(@Body() body: StartSessionBodyDTO, @ActiveUser('userId') userId: string) {
    return this.sessionService.startSession(body, userId)
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(audioFileInterceptor)
  @ZodResponse({ type: SubmitShadowingResDTO })
  submitResult(
    @Body() body: SubmitShadowingBodyDTO,
    @UploadedFile(requiredAudioFileValidationPipe)
    audio: UploadedFileData,
    @ActiveUser('userId') userId: string,
  ) {
    return this.shadowingService.submitResult(body, audio.buffer, audio.mimetype, userId)
  }
}
