import { Injectable } from '@nestjs/common'
import { type SessionMode } from '@/generated/prisma/client'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class VideoSessionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findActiveSession(userId: string, videoId: string, mode: SessionMode) {
    return this.prismaService.userLearningSession.findFirst({
      where: { userId, videoId, mode, finishedAt: null },
      orderBy: { createdAt: 'desc' },
    })
  }

  createSession(payload: { userId: string; videoId: string; mode: SessionMode }) {
    return this.prismaService.userLearningSession.create({
      data: { userId: payload.userId, videoId: payload.videoId, mode: payload.mode },
    })
  }

  /**
   * Lấy session kèm tổng số câu của video để tính summary khi finish
   */
  findSessionById(sessionId: number) {
    return this.prismaService.userLearningSession.findUnique({
      where: { id: sessionId },
      include: {
        video: { select: { _count: { select: { sentences: true } } } },
      },
    })
  }

  finishSession(sessionId: number) {
    return this.prismaService.userLearningSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date() },
    })
  }

  finishSessionIfPending(sessionId: number) {
    return this.prismaService.userLearningSession.updateMany({
      where: { id: sessionId, finishedAt: null },
      data: { finishedAt: new Date() },
    })
  }

  countDictationResultsBySessionId(sessionId: number) {
    return this.prismaService.userDictationResult.count({ where: { sessionId } })
  }

  countShadowingResultsBySessionId(sessionId: number) {
    return this.prismaService.userShadowingResult.count({ where: { sessionId } })
  }

  async findCompletedDictationSentenceIds(sessionId: number): Promise<number[]> {
    const rows = await this.prismaService.userDictationResult.findMany({
      where: { sessionId },
      select: { sentenceId: true },
    })
    return rows.map((r) => r.sentenceId)
  }

  async findCompletedShadowingSentenceIds(sessionId: number): Promise<number[]> {
    const rows = await this.prismaService.userShadowingResult.findMany({
      where: { sessionId },
      select: { sentenceId: true },
    })
    return rows.map((r) => r.sentenceId)
  }

  findDictationResultsBySession(sessionId: number) {
    return this.prismaService.userDictationResult.findMany({ where: { sessionId } })
  }

  findShadowingResultsBySession(sessionId: number) {
    return this.prismaService.userShadowingResult.findMany({ where: { sessionId } })
  }
}
