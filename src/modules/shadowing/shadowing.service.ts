import { CloudinaryService } from '@/common/services/cloudinary.service'
import { SpeechToTextService } from '@/common/services/speech-to-text.service'
import envConfig from '@/common/utils/config'
import { computeShadowingScore } from '@/common/utils/scoring'
import { ShadowingRepository } from '@/modules/shadowing/shadowing.repo'
import { SubmitShadowingBodyType } from '@/modules/shadowing/shadowing.schema'
import { VideoSessionRepository } from '@/modules/video-session/video-session.repo'
import { VideoRepository } from '@/modules/video/video.repo'
import { UserStatRepository } from '@/common/repositories/user-stat.repo'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class ShadowingService {
  constructor(
    private readonly shadowingRepository: ShadowingRepository,
    private readonly sessionRepository: VideoSessionRepository,
    private readonly videoRepository: VideoRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly speechToTextService: SpeechToTextService,
    private readonly userStatRepository: UserStatRepository,
  ) {}

  async submitResult(body: SubmitShadowingBodyType, audioBuffer: Buffer, audioMimetype: string, userId: string) {
    //Validate session
    const session = await this.sessionRepository.findSessionById(body.sessionId)
    if (!session) throw new NotFoundException('Error.SessionNotFound')
    if (session.userId !== userId) throw new ForbiddenException('Error.Forbidden')
    if (session.mode !== 'SHADOWING') throw new BadRequestException('Error.WrongSessionMode')
    if (session.finishedAt) throw new BadRequestException('Error.SessionAlreadyFinished')

    //Lấy câu gốc
    const sentence = await this.videoRepository.findSentenceById(body.sentenceId)
    if (!sentence) throw new NotFoundException('Error.SentenceNotFound')

    //Upload audio lên cloud storage
    const filename = `shadowing_${userId}_${body.sessionId}_${body.sentenceId}_${Date.now()}.webm`
    const audioUrl = await this.cloudinaryService.uploadAudio(
      { buffer: audioBuffer, mimetype: audioMimetype, originalname: filename, size: audioBuffer.length },
      envConfig.CLOUDINARY_SHADOWING_AUDIO_FOLDER,
    )

    //Speech-to-Text
    const transcribedText = await this.speechToTextService.transcribe(audioBuffer, audioMimetype)

    const { score, feedbackWords } = computeShadowingScore(transcribedText.text, sentence.content)

    await this.shadowingRepository.upsertResult({
      sessionId: body.sessionId,
      sentenceId: body.sentenceId,
      audioUrl,
      score,
      feedbackJson: JSON.stringify(feedbackWords),
    })

    const submittedCount = await this.sessionRepository.countShadowingResultsBySessionId(body.sessionId)
    if (submittedCount === session.video._count.sentences) {
      const finishResult = await this.sessionRepository.finishSessionIfPending(body.sessionId)
      if (finishResult.count > 0) {
        await this.userStatRepository.updateStreak(session.userId)
      }
    }

    return { score, transcribedText: transcribedText.text, feedbackJson: feedbackWords, audioUrl }
  }
}
