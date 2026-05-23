import { UserRole, UserRoleType } from '@/common/constants/auth.constant'
import { CloudinaryService } from '@/common/services/cloudinary.service'
import { VoiceType, VoiceTypeType } from '@/common/constants/article.constant'
import envConfig from '@/common/utils/config'
import { ArticleRepository } from '@/modules/article/article.repo'
import { UserStatRepository } from '@/common/repositories/user-stat.repo'
import {
  ArticleProgressBodyType,
  CreateArticleBodyType,
  CreateQuizBodyType,
  CreateArticleVocabulariesBodyType,
  GetArticlesQueryType,
  QuizAttemptResultType,
  SubmitArticleQuizBodyType,
  UpdateArticleBodyType,
  UpdateQuizQuestionType,
} from '@/modules/article/article.schema'
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UploadedFileData } from '@/common/types/uploaded-file.type'
import { AudioData } from '@/modules/article/interfaces/audio.types'

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userStatRepository: UserStatRepository,
  ) {}

  async getTopics() {
    const topics = await this.articleRepository.findAllTopics()
    return { data: topics }
  }

  async getArticles(query: GetArticlesQueryType) {
    const { data, total } = await this.articleRepository.findArticles({
      topicIds: query.topicIds,
      level: query.level,
      status: query.status ?? 'PUBLISHED',
      search: query.search,
      page: query.page,
      limit: query.limit,
    })

    return {
      data: data.map((a) => ({
        id: a.id,
        level: a.level,
        title: a.title,
        thumbnailUrl: a.thumbnailUrl,
        sourceUrl: a.sourceUrl,
        status: a.status,
        voiceType: a.voiceType,
        readingTimeMin: a.readingTimeMin,
        createdAt: a.createdAt,
        topics: a.topicMappings.map((m) => m.articleTopic),
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    }
  }

  async getArticleVocabularies(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    const vocabularies = await this.articleRepository.findVocabulariesByArticleId(articleId)
    return {
      data: vocabularies,
    }
  }

  async getArticleQuiz(articleId: string, userId: string, role: UserRoleType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    const quizQuestions = await this.articleRepository.findQuizByArticleId(articleId)

    return {
      data: this.isPrivateArticleView(article.createdBy, userId, role)
        ? quizQuestions
        : this.toPublicQuizQuestions(quizQuestions),
    }
  }

  async findQuizAttemptById(attemptId: number, userId: string, articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    const [quizQuestions, attempt] = await Promise.all([
      this.articleRepository.findQuizByArticleId(articleId),
      this.articleRepository.findFinishedQuizAttemptById(attemptId, userId, articleId),
    ])

    if (!attempt) throw new NotFoundException([{ message: 'Error.QuizAttemptNotFound' }])

    return {
      attemptId: attempt.id,
      totalQuestions: attempt.totalQuestions,
      correctCount: attempt.correctCount,
      finishedAt: attempt.finishedAt,
      answerLogs: this.transformAnswerLogs(attempt.answerLogs, quizQuestions),
    }
  }

  async startArticleQuiz(userId: string, articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    const quizQuestions = await this.articleRepository.findQuizByArticleId(articleId)

    const attempt = await this.articleRepository.createQuizAttempt({
      userId,
      articleId,
      totalQuestions: quizQuestions.length,
    })

    return {
      attemptId: attempt.id,
      totalQuestions: attempt.totalQuestions,
      quizQuestions: this.toPublicQuizQuestions(quizQuestions),
      startedAt: attempt.startedAt,
    }
  }

  async getAllQuizAttempts(userId: string, articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    const attempts = await this.articleRepository.findFinishedQuizAttempts(userId, articleId)

    return {
      data: attempts.map((attempt) => ({
        attemptId: attempt.id,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        finishedAt: attempt.finishedAt,
      })),
    }
  }

  async submitArticleQuiz(userId: string, articleId: string, body: SubmitArticleQuizBodyType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    const attempt = await this.articleRepository.findQuizAttemptById(body.attemptId)
    if (!attempt) throw new NotFoundException([{ message: 'Error.QuizAttemptNotFound' }])
    if (attempt.userId !== userId) throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    if (attempt.articleId !== articleId)
      throw new BadRequestException([{ message: 'Error.QuizAttemptNotMatchArticle' }])
    if (attempt.finishedAt) throw new BadRequestException([{ message: 'Error.QuizAttemptAlreadyFinished' }])

    const quizQuestions = await this.articleRepository.findQuizQuestionsForScoring(articleId)
    if (quizQuestions.length === 0) throw new BadRequestException([{ message: 'Error.QuizNotFound' }])

    const questionIdSet = new Set(quizQuestions.map((q) => q.id))
    for (const a of body.answers) {
      if (!questionIdSet.has(a.questionId)) {
        throw new BadRequestException([{ message: 'Error.InvalidQuizQuestion' }])
      }
    }

    const answerByQuestionId = new Map<string, string | null>()
    for (const a of body.answers) {
      answerByQuestionId.set(a.questionId, a.selectedOptionId ?? null)
    }

    let correctCount = 0
    const answerLogs: { questionId: string; selectedOptionId: string | null; isCorrect: boolean }[] = []
    const answerResults: {
      question: {
        questionId: string
        questionTextVi: string | null
        evidenceText: string | null
        evidenceTextVi: string | null
        explanation: string | null
      }
      options: { id: string; text: string; textVi: string | null }[]
      selectedOptionId: string | null
      correctOptionId: string
      isCorrect: boolean
    }[] = []

    for (const q of quizQuestions) {
      const selectedOptionId = answerByQuestionId.get(q.id) ?? null

      const correctOptions = q.options.filter((o) => o.isCorrect)
      if (correctOptions.length !== 1) {
        throw new BadRequestException([{ message: 'Error.InvalidQuizData' }])
      }
      const correctOptionId = correctOptions[0].id

      if (selectedOptionId !== null && !q.options.some((o) => o.id === selectedOptionId)) {
        throw new BadRequestException([{ message: 'Error.InvalidQuizOption' }])
      }

      const isCorrect = selectedOptionId !== null && selectedOptionId === correctOptionId
      if (isCorrect) correctCount++

      answerLogs.push({
        questionId: q.id,
        selectedOptionId,
        isCorrect,
      })

      answerResults.push({
        question: {
          questionId: q.id,
          questionTextVi: q.questionTextVi,
          evidenceText: q.evidenceText,
          evidenceTextVi: q.evidenceTextVi,
          explanation: q.explanation,
        },
        options: q.options.map((o) => ({ id: o.id, text: o.text, textVi: o.textVi })),
        selectedOptionId,
        correctOptionId,
        isCorrect,
      })
    }

    const finishedAt = new Date()
    await this.articleRepository.submitQuizAttempt({
      attemptId: attempt.id,
      totalQuestions: quizQuestions.length,
      correctCount,
      finishedAt,
      answerLogs,
    })

    const scorePct = quizQuestions.length === 0 ? 0 : Math.round((correctCount / quizQuestions.length) * 100)

    return {
      attemptId: attempt.id,
      totalQuestions: quizQuestions.length,
      correctCount,
      scorePct,
      finishedAt,
      results: answerResults,
    }
  }

  async getArticleContent(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    return {
      ...article,
      topics: article.topicMappings.map((mapping) => mapping.articleTopic),
    }
  }

  private isPrivateArticleView(articleCreatedBy: string, userId: string, role: UserRoleType) {
    if (role === UserRole.ADMIN) return true
    if (role === UserRole.TEACHER && userId === articleCreatedBy) return true

    return false
  }

  private toPublicQuizQuestions(quizQuestions: Awaited<ReturnType<ArticleRepository['findQuizByArticleId']>>) {
    return quizQuestions.map(
      ({
        questionTextVi: _questionTextVi,
        evidenceText: _evidenceText,
        evidenceTextVi: _evidenceTextVi,
        explanation: _explanation,
        options,
        ...question
      }) => ({
        ...question,
        options: options.map(({ textVi: _textVi, isCorrect: _isCorrect, ...option }) => option),
      }),
    )
  }

  private transformAnswerLogs(
    answerLogs: Array<{ questionId: string; selectedOptionId: string | null; isCorrect: boolean }>,
    quizQuestions: Awaited<ReturnType<ArticleRepository['findQuizByArticleId']>>,
  ): QuizAttemptResultType[] {
    return answerLogs
      .map((log) => {
        const question = quizQuestions.find((q) => q.id === log.questionId)
        if (!question) {
          return null
        }

        const correctOption = question.options.find((o) => o.isCorrect)

        return {
          question: {
            questionId: question.id,
            questionText: question.questionText,
            questionTextVi: question.questionTextVi,
            evidenceText: question.evidenceText,
            evidenceTextVi: question.evidenceTextVi,
            explanation: question.explanation,
          },
          options: question.options.map(({ id, text, textVi }) => ({ id, text, textVi })),
          selectedOptionId: log.selectedOptionId,
          correctOptionId: correctOption?.id || '',
          isCorrect: log.isCorrect,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }

  async updateProgress(userId: string, articleId: string, body: ArticleProgressBodyType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    // Auto-complete nếu scroll đến >= 95%
    const completed = body.completed ?? body.progressPct >= 95

    const progress = await this.articleRepository.upsertProgress({
      userId,
      articleId,
      progressPct: body.progressPct,
      completed,
    })
    // Update learning streak (idempotent) when user reads article
    await this.userStatRepository.updateStreak(userId)

    return {
      message: 'Cập nhật tiến độ thành công',
      progressPct: progress.progressPct,
      completed: progress.completed,
    }
  }

  async updateArticle(
    articleId: string,
    body: UpdateArticleBodyType,
    createdBy: string,
    thumbnailFile?: UploadedFileData,
  ) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    const { topicIds, ...rest } = body
    if (article.createdBy !== createdBy) throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    let thumbnailUrlToSet: string | undefined = undefined
    if (thumbnailFile) {
      if (article.thumbnailUrl) {
        await this.cloudinaryService.deleteResourceByUrl(article.thumbnailUrl, 'image')
      }
      thumbnailUrlToSet = await this.cloudinaryService.uploadImage(
        thumbnailFile,
        envConfig.CLOUDINARY_ARTICLE_THUMBNAIL_FOLDER,
      )
    } else if (rest.thumbnailUrl !== undefined) {
      thumbnailUrlToSet = rest.thumbnailUrl
    }

    const updated = await this.articleRepository.updateArticle(
      articleId,
      {
        ...(rest.level && { level: rest.level }),
        ...(rest.title && { title: rest.title }),
        ...(rest.content && { content: rest.content }),
        ...(rest.contentVi !== undefined && { contentVi: rest.contentVi }),
        ...(thumbnailUrlToSet !== undefined && { thumbnailUrl: thumbnailUrlToSet }),
        ...(rest.sourceUrl !== undefined && { sourceUrl: rest.sourceUrl }),
        ...(rest.audioUrl !== undefined && { audioUrl: rest.audioUrl }),
        ...(rest.voiceType !== undefined && { voiceType: rest.voiceType }),
        ...(rest.readingTimeMin !== undefined && { readingTimeMin: rest.readingTimeMin }),
        ...(rest.status && { status: rest.status }),
      },
      topicIds,
    )

    return { message: 'Cập nhật bài báo thành công', article: updated }
  }

  async adminDeleteArticle(articleId: string, userId: string, role: UserRoleType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    if (role !== UserRole.ADMIN && article.createdBy !== userId)
      throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    await this.articleRepository.softDeleteArticle(articleId)
    return { message: 'Xóa bài báo thành công' }
  }

  async createArticle(body: CreateArticleBodyType, createdBy: string, thumbnailFile?: UploadedFileData) {
    const content = this.normalizeArticleContent(body.content)
    const voiceType = body.voiceType ?? VoiceType.UK_FEMALE
    const { audioBuffer, speechMarksdata } = await this.generateArticleAudio(content, voiceType)
    const dateStamp = this.formatDateStamp(new Date())
    const articleSlug = this.slugify(body.title)

    console.log('speechMarksdata: ', speechMarksdata)

    const audioUrl = await this.cloudinaryService.uploadAudio(
      {
        buffer: audioBuffer,
        mimetype: 'audio/mpeg',
        originalname: `article_${dateStamp}_${articleSlug}.mp3`,
        size: audioBuffer.byteLength,
      },
      envConfig.CLOUDINARY_ARTICLE_AUDIO_FOLDER,
    )

    let thumbnailUrl: string | undefined = undefined
    if (thumbnailFile) {
      thumbnailUrl = await this.cloudinaryService.uploadImage(
        thumbnailFile,
        envConfig.CLOUDINARY_ARTICLE_THUMBNAIL_FOLDER,
      )
    }

    const articleId = await this.articleRepository.createArticle({
      body: {
        ...body,
        content,
        voiceType,
        audioUrl,
        speechMarks: speechMarksdata,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      },
      createdBy,
    })
    return { articleId, audioUrl, message: 'Tạo bài báo thành công' }
  }

  private normalizeArticleContent(content: string) {
    return content.replace(/\r\n/g, '\n').trim()
  }

  private formatDateStamp(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
  }

  private async generateArticleAudio(
    content: string,
    voiceType: VoiceTypeType,
  ): Promise<{ audioBuffer: Buffer; speechMarksdata: AudioData | null }> {
    const response = await fetch(`${envConfig.FASTAPI_SERVER_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: content,
        voice_type: voiceType,
      }).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new BadGatewayException([
        {
          message: 'Error.GenerateArticleAudioFailed',
          detail: errorText || `FastAPI TTS returned ${response.status}`,
        },
      ])
    }

    const contentType = response.headers.get('content-type') ?? ''
    let audioBuffer: Buffer
    let speechMarksdata: AudioData | null = null

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as {
        audioBase64?: string
        metadata?: AudioData | null
      }

      if (!data.audioBase64) {
        throw new BadGatewayException([{ message: 'Error.GenerateArticleAudioFailed' }])
      }

      audioBuffer = Buffer.from(data.audioBase64, 'base64')
      speechMarksdata = data.metadata ?? null
    } else {
      const arrayBuffer = await response.arrayBuffer()
      if (arrayBuffer.byteLength === 0) {
        throw new BadGatewayException([{ message: 'Error.GenerateArticleAudioFailed' }])
      }

      audioBuffer = Buffer.from(arrayBuffer)

      const speechMarksRaw = response.headers.get('x-audio-metadata')
      speechMarksdata = speechMarksRaw ? (JSON.parse(speechMarksRaw) as AudioData) : null
    }

    if (audioBuffer.byteLength === 0) {
      throw new BadGatewayException([{ message: 'Error.GenerateArticleAudioFailed' }])
    }

    return {
      audioBuffer,
      speechMarksdata,
    }
  }

  async createArticleVocabularies(
    articleId: string,
    body: CreateArticleVocabulariesBodyType,
    createdBy: string,
    role: UserRoleType,
  ): Promise<{ message: string }> {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    if (role !== UserRole.ADMIN && article.createdBy !== createdBy)
      throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    await this.articleRepository.createArticleVocabularies(articleId, body.vocabularies, createdBy)
    return { message: `Tạo thành công ${body.vocabularies.length} từ vựng` }
  }

  async createQuiz(articleId: string, body: CreateQuizBodyType, createdBy: string, role: UserRoleType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    if (role !== UserRole.ADMIN && article.createdBy !== createdBy)
      throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    await this.articleRepository.createQuizQuestions(articleId, body.questions)
    return { message: `Tạo thành công ${body.questions.length} câu hỏi` }
  }

  async updateQuizQuestion(questionId: string, body: UpdateQuizQuestionType, userId: string, role: UserRoleType) {
    const question = await this.articleRepository.findQuizQuestionById(questionId)
    if (!question) throw new NotFoundException([{ message: 'Error.QuizQuestionNotFound' }])
    const article = await this.articleRepository.findArticleById(question.articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    if (role !== UserRole.ADMIN && article.createdBy !== userId)
      throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    const updateData: Parameters<ArticleRepository['updateQuizQuestion']>[1] = {}

    if (body.questionText !== undefined) updateData.questionText = body.questionText
    if (body.questionTextVi !== undefined) updateData.questionTextVi = body.questionTextVi
    if (body.types !== undefined) updateData.types = body.types
    if (body.evidenceText !== undefined) updateData.evidenceText = body.evidenceText
    if (body.evidenceTextVi !== undefined) updateData.evidenceTextVi = body.evidenceTextVi
    if (body.explanation !== undefined) updateData.explanation = body.explanation
    if (body.orderIndex !== undefined) updateData.orderIndex = body.orderIndex

    const updated = await this.articleRepository.updateQuizQuestion(questionId, updateData, body.options)
    return { message: 'Cập nhật câu hỏi thành công', question: updated }
  }

  async deleteQuizQuestion(questionId: string, userId: string, role: UserRoleType) {
    const question = await this.articleRepository.findQuizQuestionById(questionId)
    if (!question) throw new NotFoundException([{ message: 'Error.QuizQuestionNotFound' }])
    const article = await this.articleRepository.findArticleById(question.articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    if (role !== UserRole.ADMIN && article.createdBy !== userId)
      throw new ForbiddenException([{ message: 'Error.Forbidden' }])
    await this.articleRepository.deleteQuizQuestion(questionId)
    return { message: 'Xóa câu hỏi thành công' }
  }
}
