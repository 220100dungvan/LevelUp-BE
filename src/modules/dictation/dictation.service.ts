import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { VideoSessionRepository } from '@/modules/video-session/video-session.repo'
import { VideoRepository } from '@/modules/video/video.repo'
import { DictationRepository } from '@/modules/dictation/dictation.repo'
import { SubmitDictationBodyType } from '@/modules/dictation/dictation.schema'
import { TokenService } from '@/common/services/token.service'
import { DictationSubmitPayload } from '@/common/types/jwt.type'
import { computeDictationDiff } from '@/common/utils/scoring'

@Injectable()
export class DictationService {
  constructor(
    private readonly dictationRepo: DictationRepository,
    private readonly sessionRepo: VideoSessionRepository,
    private readonly videoRepo: VideoRepository,
    private readonly tokenService: TokenService,
  ) {}

  async submitResult(body: SubmitDictationBodyType, userId: string) {
    // 1. Decode JWT payload
    let decodedPayload: DictationSubmitPayload
    try {
      decodedPayload = await this.tokenService.verifyDictationSubmit(body.data)
    } catch {
      throw new BadRequestException('Error.InvalidToken')
    }

    const { sessionId, sentenceId, userText, replayCount } = decodedPayload

    // 2. Validate session
    const session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) throw new NotFoundException('Error.SessionNotFound')
    if (session.userId !== userId) throw new ForbiddenException('Error.Forbidden')
    if (session.mode !== 'DICTATION') throw new BadRequestException('Error.WrongSessionMode')
    if (session.finishedAt) throw new BadRequestException('Error.SessionAlreadyFinished')

    // 3. Lấy câu gốc
    const sentence = await this.videoRepo.findSentenceById(sentenceId)
    if (!sentence) throw new NotFoundException('Error.SentenceNotFound')

    // 4. Tính điểm (normalize + greedy word-by-word diff)
    const { diff, correctCount, wrongCount, correctnessPercentage, isCorrect } = computeDictationDiff(
      userText,
      sentence.content,
    )

    // 5. Upsert result với  replayCount từ JWT
    await this.dictationRepo.upsertResult({
      sessionId,
      sentenceId,
      userText,
      correctCount,
      wrongCount,
      replayCount,
    })

    // 7. Query tất cả submitted results trong session này
    const submittedResults = await this.dictationRepo.findResultsBySessionId(sessionId)

    return {
      isCorrect,
      correctnessPercentage,
      diff,
      correctContent: sentence.content,
      submittedResults,
    }
  }
}
