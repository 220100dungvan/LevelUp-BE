import { IsPublic } from './../../common/decorators/auth.decorator'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  CreateSessionBodyDTO,
  CreateSessionResDTO,
  GetSessionsQueryDTO,
  GetSessionsResDTO,
  GetSpeakingTopicsResDTO,
  JoinQueueBodyDTO,
  JoinQueueResDTO,
  JoinSessionBodyDTO,
  JoinSessionResDTO,
} from '@/modules/speaking/speaking.dto'
import { SpeakingGateway } from '@/modules/speaking/speaking.gateway'
import { SpeakingService } from '@/modules/speaking/speaking.service'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { ZodResponse } from 'nestjs-zod'

@SkipThrottle()
@Controller('speaking')
export class SpeakingController {
  constructor(
    private readonly speakingService: SpeakingService,
    private readonly speakingGateway: SpeakingGateway,
  ) {}

  // GET /speaking/topics
  @Get('topics')
  @IsPublic()
  @ZodResponse({ type: GetSpeakingTopicsResDTO })
  getTopics() {
    return this.speakingService.getTopics()
  }

  // GET /speaking/sessions
  @Get('sessions')
  @IsPublic()
  @ZodResponse({ type: GetSessionsResDTO })
  getSessions(@Query() query: GetSessionsQueryDTO) {
    return this.speakingService.getSessions(query)
  }

  // POST /speaking/sessions
  @Post('sessions')
  @ZodResponse({ type: CreateSessionResDTO })
  async createSession(@Body() body: CreateSessionBodyDTO, @ActiveUser('userId') userId: string) {
    return this.speakingService.createSession(userId, body)
  }

  // POST /speaking/sessions/:id/join
  @Post('sessions/:id/join')
  @ZodResponse({ type: JoinSessionResDTO })
  async joinSession(
    @Param('id') sessionId: string,
    @Body() body: JoinSessionBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.speakingService.joinSession(sessionId, userId, body)
  }

  // POST /speaking/join-queue
  @Post('join-queue')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: JoinQueueResDTO })
  async joinQueue(@Body() body: JoinQueueBodyDTO, @ActiveUser('userId') userId: string) {
    const result = await this.speakingService.joinQueue(userId, body)

    // Nếu tìm được match ngay thì emit sự kiện để cả 2 client vào phòng
    if (result.matched && result.sessionId && result.partnerId) {
      this.speakingGateway.emitMatchFound(userId, {
        sessionId: result.sessionId,
        roomName: result.roomName,
        partnerId: result.partnerId,
        hostId: userId,
      })
      this.speakingGateway.emitMatchFound(result.partnerId, {
        sessionId: result.sessionId,
        roomName: result.roomName,
        partnerId: userId,
        hostId: userId,
      })
    }

    return result
  }

  // DELETE /speaking/leave-queue
  @Delete('leave-queue')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  leaveQueue(@ActiveUser('userId') userId: string) {
    return this.speakingService.leaveQueue(userId)
  }
}
