import { ActiveUser } from '@/common/decorators/active-user.decorator'
import {
  FinishSessionResDTO,
  StartSessionBodyDTO,
  StartSessionResDTO,
  SubmitDictationBodyDTO,
  SubmitDictationResDTO,
} from '@/modules/dictation/dictation.dto'
import { DictationService } from '@/modules/dictation/dictation.service'
import { VideoSessionService } from '@/modules/video-session/video-session.service'
import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('dictation')
export class DictationController {
  constructor(
    private readonly dictationService: DictationService,
    private readonly sessionService: VideoSessionService,
  ) {}

  /**
   * POST /dictation/session/start
   * Khởi tạo hoặc resume phiên Dictation (mode='DICTATION')
   */
  @Post('session/start')
  @ZodResponse({ type: StartSessionResDTO })
  startSession(@Body() body: StartSessionBodyDTO, @ActiveUser('userId') userId: string) {
    return this.sessionService.startSession(body, userId)
  }

  /**
   * POST /dictation/submit
   * lưu kết quả vào DB, trả về kết quả chấm điểm + tất cả kết quả đã submit trong session này
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: SubmitDictationResDTO })
  submitResult(@Body() body: SubmitDictationBodyDTO, @ActiveUser('userId') userId: string) {
    return this.dictationService.submitResult(body, userId)
  }

  /**
   * PATCH /dictation/session/:sessionId/finish
   * Kết thúc phiên, trả về tổng kết
   */
  @Patch('session/:sessionId/finish')
  @ZodResponse({ type: FinishSessionResDTO })
  finishSession(@Param('sessionId', ParseIntPipe) sessionId: number, @ActiveUser('userId') userId: string) {
    return this.sessionService.finishSession(sessionId, userId)
  }

  // @Get(':videoId')
}
