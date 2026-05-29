import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'

@Injectable()
export class DictationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsertResult(payload: {
    sessionId: number
    sentenceId: number
    userText: string
    correctCount: number
    wrongCount: number
    replayCount?: number
  }) {
    const updateData: any = {
      userText: payload.userText,
      correctCount: payload.correctCount,
      wrongCount: payload.wrongCount,
      updatedAt: new Date(),
    }

    return this.prismaService.userDictationResult.upsert({
      where: {
        sessionId_sentenceId: { sessionId: payload.sessionId, sentenceId: payload.sentenceId },
      },
      create: {
        sessionId: payload.sessionId,
        sentenceId: payload.sentenceId,
        userText: payload.userText,
        correctCount: payload.correctCount,
        wrongCount: payload.wrongCount,
      },
      update: updateData,
    })
  }

  findResultsBySessionId(sessionId: number) {
    return this.prismaService.userDictationResult.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })
  }
}
