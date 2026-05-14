import { PrismaService } from '@/common/services/prisma.service'
import {
  Article,
  ArticleQuizAttempt,
  ArticleQuizOption,
  ArticleQuizQuestion,
  ArticleStatus,
  ArticleTopic,
  Level,
  Prisma,
  UserArticleProgress,
  Vocabulary,
} from '@/generated/prisma/client'
import {
  CreateArticleBodyType,
  CreateArticleVocabularyType,
  CreateQuizQuestionType,
  UpdateQuizOptionType,
} from '@/modules/article/article.schema'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ArticleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAllTopics(): Promise<ArticleTopic[]> {
    return this.prismaService.articleTopic.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
  }

  async findArticles(params: {
    topicIds?: string[]
    level?: Level
    status?: ArticleStatus
    search?: string
    page: number
    limit: number
  }): Promise<{
    data: (Article & { topicMappings: { articleTopic: ArticleTopic }[] })[]
    total: number
  }> {
    const { topicIds, level, status, search, page, limit } = params
    const skip = (page - 1) * limit

    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      ...(level && { level: level }),
      ...(status && { status: status }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(topicIds &&
        topicIds.length > 0 && {
          topicMappings: {
            some: {
              topicId: { in: topicIds },
            },
          },
        }),
    }

    const [data, total] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          topicMappings: { include: { articleTopic: true } },
        },
      }),
      this.prismaService.article.count({ where }),
    ])

    return { data, total }
  }

  findArticleById(articleId: string): Promise<(Article & { topicMappings: { articleTopic: ArticleTopic }[] }) | null> {
    return this.prismaService.article.findUnique({
      where: { id: articleId, deletedAt: null },
      include: {
        topicMappings: { include: { articleTopic: true } },
      },
    })
  }

  //từ vựng của article
  async findVocabulariesByArticleId(articleId: string): Promise<
    (Vocabulary & {
      hasSynonyms: { id: string; word: string }[]
      hasAntonyms: { id: string; word: string }[]
    })[]
  > {
    const data = await this.prismaService.vocabulary.findMany({
      where: {
        mediaLinks: { some: { mediaId: articleId, mediaType: 'ARTICLE' } },
        deletedAt: null,
      },
      include: {
        hasSynonyms: {
          include: {
            synonym: {
              select: {
                id: true,
                word: true,
              },
            },
          },
        },
        hasAntonyms: {
          include: {
            antonym: {
              select: {
                id: true,
                word: true,
              },
            },
          },
        },
      },
    })
    return data.map((v) => ({
      ...v,
      hasSynonyms: v.hasSynonyms.map((s) => s.synonym),
      hasAntonyms: v.hasAntonyms.map((a) => a.antonym),
    }))
  }

  findQuizByArticleId(articleId: string): Promise<(ArticleQuizQuestion & { options: ArticleQuizOption[] })[]> {
    return this.prismaService.articleQuizQuestion.findMany({
      where: { articleId },
      orderBy: { orderIndex: 'asc' },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
  }

  findQuizQuestionById(questionId: string): Promise<(ArticleQuizQuestion & { options: ArticleQuizOption[] }) | null> {
    return this.prismaService.articleQuizQuestion.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { orderIndex: 'asc' } } },
    })
  }

  upsertProgress(params: {
    userId: string
    articleId: string
    progressPct: number
    completed: boolean
  }): Promise<UserArticleProgress> {
    return this.prismaService.userArticleProgress.upsert({
      where: { userId_articleId: { userId: params.userId, articleId: params.articleId } },
      create: {
        userId: params.userId,
        articleId: params.articleId,
        progressPct: params.progressPct,
        completed: params.completed,
        lastReadAt: new Date(),
      },
      update: {
        progressPct: params.progressPct,
        completed: params.completed,
        lastReadAt: new Date(),
      },
    })
  }

  async updateArticle(articleId: string, data: Prisma.ArticleUpdateInput, topicIds?: string[]): Promise<Article> {
    return this.prismaService.$transaction(async (tx) => {
      const article = await tx.article.update({ where: { id: articleId }, data })

      if (topicIds) {
        // Xóa hết topic cũ rồi tạo lại
        await tx.articleTopicMapping.deleteMany({ where: { articleId } })
        await tx.articleTopicMapping.createMany({
          data: topicIds.map((topicId) => ({ articleId, topicId })),
        })
      }

      return article
    })
  }

  softDeleteArticle(articleId: string): Promise<Article> {
    return this.prismaService.article.update({
      where: { id: articleId },
      data: { deletedAt: new Date() },
    })
  }

  async createArticle(params: {
    body: CreateArticleBodyType & { audioUrl?: string; speechMarks?: any }
    createdBy: string
  }): Promise<string> {
    const { body, createdBy } = params

    return this.prismaService.$transaction(async (tx) => {
      // 1. Tạo Article
      const article = await tx.article.create({
        data: {
          level: body.level,
          title: body.title,
          content: body.content,
          contentVi: body.contentVi ?? null,
          thumbnailUrl: body.thumbnailUrl ?? null,
          sourceUrl: body.sourceUrl ?? null,
          audioUrl: body.audioUrl ?? null,
          speechMarks: body.speechMarks ?? null,
          voiceType: body.voiceType ?? null,
          readingTimeMin: body.readingTimeMin ?? null,
          status: body.status,
          createdBy,
        },
      })

      // 2. Gắn topics
      await tx.articleTopicMapping.createMany({
        data: body.topicIds.map((topicId) => ({ articleId: article.id, topicId })),
      })

      return article.id
    })
  }

  async createArticleVocabularies(articleId: string, vocabularies: CreateArticleVocabularyType[], createdBy: string) {
    return this.prismaService.$transaction(async (tx) => {
      for (const v of vocabularies) {
        const vocab = await tx.vocabulary.upsert({
          where: {
            word_partOfSpeech_meaningVi: {
              word: v.word.toLowerCase().trim(),
              partOfSpeech: v.partOfSpeech ?? '',
              meaningVi: v.meaningVi,
            },
          },
          create: {
            word: v.word.toLowerCase().trim(),
            phoneticUk: v.phoneticUk ?? null,
            phoneticUs: v.phoneticUs ?? null,
            partOfSpeech: v.partOfSpeech ?? null,
            meaningVi: v.meaningVi,
            meaningEn: v.meaningEn ?? null,
            exampleEn: v.exampleEn ?? null,
            exampleVi: v.exampleVi ?? null,
            imageUrl: v.imageUrl ?? null,
            audioUrlUk: v.audioUrlUk ?? null,
            audioUrlUs: v.audioUrlUs ?? null,
            audioExampleUrl: v.audioExampleUrl ?? null,
            level: v.level ?? null,
            isVerified: true,
            createdBy,
          },
          update: {
            isVerified: true,
            meaningVi: v.meaningVi,
            meaningEn: v.meaningEn ?? null,
            exampleEn: v.exampleEn ?? null,
            exampleVi: v.exampleVi ?? null,
          },
        })

        await tx.mediaVocabulary.upsert({
          where: { vocabularyId_mediaId: { vocabularyId: vocab.id, mediaId: articleId } },
          create: { vocabularyId: vocab.id, mediaId: articleId, mediaType: 'ARTICLE' },
          update: {},
        })
      }
    })
  }

  async createQuizQuestions(articleId: string, questions: CreateQuizQuestionType[]): Promise<void> {
    for (const q of questions) {
      await this.prismaService.articleQuizQuestion.create({
        data: {
          articleId,
          questionText: q.questionText,
          questionTextVi: q.questionTextVi ?? null,
          types: q.types,
          evidenceText: q.evidenceText ?? null,
          evidenceTextVi: q.evidenceTextVi ?? null,
          explanation: q.explanation ?? null,
          orderIndex: q.orderIndex ?? 0,
          options: {
            createMany: {
              data: q.options.map((opt, idx) => ({
                text: opt.text,
                textVi: opt.textVi ?? null,
                isCorrect: opt.isCorrect,
                orderIndex: opt.orderIndex ?? idx,
              })),
            },
          },
        },
      })
    }
  }

  async updateQuizQuestion(
    questionId: string,
    data: Prisma.ArticleQuizQuestionUpdateInput,
    options?: UpdateQuizOptionType[],
  ): Promise<ArticleQuizQuestion> {
    if (!options) {
      return this.prismaService.articleQuizQuestion.update({ where: { id: questionId }, data })
    }

    return this.prismaService.$transaction(async (tx) => {
      const updated = await tx.articleQuizQuestion.update({ where: { id: questionId }, data })

      await tx.articleQuizOption.deleteMany({ where: { questionId } })
      await tx.articleQuizOption.createMany({
        data: options.map((option, index) => ({
          questionId,
          text: option.text,
          textVi: option.textVi ?? null,
          isCorrect: option.isCorrect,
          orderIndex: option.orderIndex ?? index,
        })),
      })

      return updated
    })
  }

  async deleteQuizQuestion(questionId: string): Promise<void> {
    // Xóa options trước do không có cascade
    await this.prismaService.articleQuizOption.deleteMany({ where: { questionId } })
    await this.prismaService.articleQuizQuestion.delete({ where: { id: questionId } })
  }

  countQuizQuestions(articleId: string): Promise<number> {
    return this.prismaService.articleQuizQuestion.count({ where: { articleId } })
  }

  createQuizAttempt(payload: {
    userId: string
    articleId: string
    totalQuestions: number
  }): Promise<ArticleQuizAttempt> {
    return this.prismaService.articleQuizAttempt.create({
      data: {
        userId: payload.userId,
        articleId: payload.articleId,
        totalQuestions: payload.totalQuestions,
      },
    })
  }

  findQuizAttemptById(attemptId: number): Promise<ArticleQuizAttempt | null> {
    return this.prismaService.articleQuizAttempt.findUnique({ where: { id: attemptId } })
  }

  findQuizQuestionsForScoring(articleId: string): Promise<
    {
      id: string
      questionTextVi: string | null
      evidenceText: string | null
      evidenceTextVi: string | null
      explanation: string | null
      options: { id: string; text: string; textVi: string | null; isCorrect: boolean }[]
    }[]
  > {
    return this.prismaService.articleQuizQuestion.findMany({
      where: { articleId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        questionTextVi: true,
        evidenceText: true,
        evidenceTextVi: true,
        explanation: true,
        options: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            text: true,
            textVi: true,
            isCorrect: true,
          },
        },
      },
    })
  }

  async submitQuizAttempt(payload: {
    attemptId: number
    totalQuestions: number
    correctCount: number
    finishedAt: Date
    answerLogs: { questionId: string; selectedOptionId: string | null; isCorrect: boolean }[]
  }): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      await tx.articleQuizAnswerLog.createMany({
        data: payload.answerLogs.map((l) => ({
          attemptId: payload.attemptId,
          questionId: l.questionId,
          selectedOptionId: l.selectedOptionId,
          isCorrect: l.isCorrect,
        })),
      })

      await tx.articleQuizAttempt.update({
        where: { id: payload.attemptId },
        data: {
          totalQuestions: payload.totalQuestions,
          correctCount: payload.correctCount,
          finishedAt: payload.finishedAt,
        },
      })
    })
  }

  async findLatestFinishedQuizAttempt(userId: string, articleId: string) {
    return this.prismaService.articleQuizAttempt.findFirst({
      where: {
        userId,
        articleId,
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: 'desc' },
      include: {
        answerLogs: {
          orderBy: { id: 'asc' },
        },
      },
    })
  }

  async findFinishedQuizAttempts(userId: string, articleId: string) {
    return this.prismaService.articleQuizAttempt.findMany({
      where: {
        userId,
        articleId,
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: 'desc' },
      include: {
        answerLogs: {
          orderBy: { id: 'asc' },
        },
      },
    })
  }

  async findFinishedQuizAttemptById(attemptId: number, userId: string, articleId: string) {
    return this.prismaService.articleQuizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        articleId,
        finishedAt: { not: null },
      },
      include: {
        answerLogs: {
          orderBy: { id: 'asc' },
        },
      },
    })
  }
}
