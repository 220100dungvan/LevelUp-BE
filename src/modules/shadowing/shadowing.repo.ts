import { PrismaService } from '@/common/services/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ShadowingRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsertResult(payload: {
    sessionId: number
    sentenceId: number
    audioUrl: string
    score: number
    feedbackJson: string
  }) {
    return this.prismaService.userShadowingResult.upsert({
      where: {
        sessionId_sentenceId: { sessionId: payload.sessionId, sentenceId: payload.sentenceId },
      },
      create: {
        sessionId: payload.sessionId,
        sentenceId: payload.sentenceId,
        audioUrl: payload.audioUrl,
        score: payload.score,
        feedbackJson: payload.feedbackJson,
      },
      update: {
        audioUrl: payload.audioUrl,
        score: payload.score,
        updatedAt: new Date(),
        feedbackJson: payload.feedbackJson,
      },
    })
  }
}
