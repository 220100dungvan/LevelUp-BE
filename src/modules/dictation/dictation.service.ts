import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { VideoSessionRepository } from '@/modules/video-session/video-session.repo'
import { VideoRepository } from '@/modules/video/video.repo'
import { DictationRepository } from '@/modules/dictation/dictation.repo'
import { SubmitDictationBodyType } from '@/modules/dictation/dictation.schema'
import { computeDictationDiff } from '@/common/utils/scoring'

@Injectable()
export class DictationService {
  constructor(
    private readonly dictationRepo: DictationRepository,
    private readonly sessionRepo: VideoSessionRepository,
    private readonly videoRepo: VideoRepository,
  ) {}

  async submitResult(body: SubmitDictationBodyType, userId: string) {
    // 1. Validate session
    const session = await this.sessionRepo.findSessionById(body.sessionId)
    if (!session) throw new NotFoundException('Error.SessionNotFound')
    if (session.userId !== userId) throw new ForbiddenException('Error.Forbidden')
    if (session.mode !== 'DICTATION') throw new BadRequestException('Error.WrongSessionMode')
    if (session.finishedAt) throw new BadRequestException('Error.SessionAlreadyFinished')

    // 2. Lấy câu gốc
    const sentence = await this.videoRepo.findSentenceById(body.sentenceId)
    if (!sentence) throw new NotFoundException('Error.SentenceNotFound')

    // 3. Tính điểm (normalize + greedy word-by-word diff)
    const { diff, correctCount, wrongCount, correctnessPercentage, isCorrect } = computeDictationDiff(
      body.userText,
      sentence.content,
    )

    // 4. Upsert result (user có thể làm lại câu)
    await this.dictationRepo.upsertResult({
      sessionId: body.sessionId,
      sentenceId: body.sentenceId,
      userText: body.userText,
      correctCount,
      wrongCount,
    })

    // 5. Nếu đúng 100% → cộng UserStat
    if (isCorrect) {
      await this.sessionRepo.incrementWordsLearned(userId, 1)
    }

    return { isCorrect, correctnessPercentage, diff, correctContent: sentence.content }
  }
}
