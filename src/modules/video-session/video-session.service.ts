// src/modules/learning-session/learning-session.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { VideoRepository } from '@/modules/video/video.repo'
import { VideoSessionRepository } from '@/modules/video-session/video-session.repo'
import { StartSessionBodyType } from '@/modules/video-session/video-session.schema'

@Injectable()
export class VideoSessionService {
  constructor(
    private readonly sessionRepo: VideoSessionRepository,
    private readonly videoRepo: VideoRepository,
  ) {}

  // ─── Start / Resume session ─────────────────────────────────────────────────

  async startSession(body: StartSessionBodyType, userId: string) {
    const video = await this.videoRepo.findVideoById(body.videoId)
    if (!video) throw new NotFoundException('Error.VideoNotFound')

    const existing = await this.sessionRepo.findActiveSession(userId, body.videoId, body.mode)
    if (existing) {
      const completedSentenceIds =
        body.mode === 'DICTATION'
          ? await this.sessionRepo.findCompletedDictationSentenceIds(existing.id)
          : await this.sessionRepo.findCompletedShadowingSentenceIds(existing.id)

      return { sessionId: existing.id, isResumed: true, completedSentenceIds }
    }

    const session = await this.sessionRepo.createSession({ userId, videoId: body.videoId, mode: body.mode })
    return { sessionId: session.id, isResumed: false, completedSentenceIds: [] }
  }

  // ─── Finish session ─────────────────────────────────────────────────────────

  async finishSession(sessionId: number, userId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) throw new NotFoundException('Error.SessionNotFound')
    if (session.userId !== userId) throw new ForbiddenException('Error.Forbidden')
    if (session.finishedAt) throw new BadRequestException('Error.SessionAlreadyFinished')

    await this.sessionRepo.finishSession(sessionId)

    const totalSentences = session.video._count.sentences
    const durationSec = Math.round((Date.now() - session.createdAt.getTime()) / 1000)

    if (session.mode === 'DICTATION') {
      const results = await this.sessionRepo.findDictationResultsBySession(sessionId)
      const correctCount = results.filter((r) => r.wrongCount === 0 && r.correctCount > 0).length
      const wrongCount = totalSentences - correctCount
      const accuracyPct = totalSentences === 0 ? 0 : Math.round((correctCount / totalSentences) * 100)

      return {
        sessionId,
        mode: 'DICTATION' as const,
        totalSentences,
        correctCount,
        wrongCount,
        accuracyPct,
        durationSec,
        finishedAt: new Date(),
      }
    }

    // SHADOWING
    const results = await this.sessionRepo.findShadowingResultsBySession(sessionId)
    const avgScore = results.length ? results.reduce((s, r) => s + (r.score ?? 0), 0) / results.length : 0
    const correctCount = results.filter((r) => (r.score ?? 0) >= 80).length
    const wrongCount = results.length - correctCount

    return {
      sessionId,
      mode: 'SHADOWING' as const,
      totalSentences,
      correctCount,
      wrongCount,
      accuracyPct: Math.round(avgScore),
      durationSec,
      finishedAt: new Date(),
    }
  }
}
