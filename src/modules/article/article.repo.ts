import { PrismaService } from '@/common/services/prisma.service'
import {
  Article,
  ArticleQuizOption,
  ArticleQuizQuestion,
  ArticleStatus,
  ArticleTopic,
  Level,
  Prisma,
  UserArticleProgress,
  Vocabulary,
} from '@/generated/prisma/client'
import { CreateArticleBodyType, CreateQuizQuestionType } from '@/modules/article/article.schema'
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

  findQuizByArticleId(
    articleId: string,
  ): Promise<(ArticleQuizQuestion & { options: Omit<ArticleQuizOption, 'isCorrect'>[] })[]> {
    return this.prismaService.articleQuizQuestion.findMany({
      where: { articleId },
      orderBy: { orderIndex: 'asc' },
      include: {
        options: {
          omit: {
            isCorrect: true,
          },
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

  async createArticle(params: { body: CreateArticleBodyType; createdBy: string }): Promise<string> {
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

      // 3. Upsert vocabularies + liên kết MediaVocabulary
      for (const v of body.vocabularies) {
        const vocab = await tx.vocabulary.upsert({
          where: {
            word_partOfSpeech: {
              word: v.word.toLowerCase().trim(),
              partOfSpeech: v.partOfSpeech ?? '',
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

        // MediaVocabulary — polymorphic link
        await tx.mediaVocabulary.upsert({
          where: { vocabularyId_mediaId: { vocabularyId: vocab.id, mediaId: article.id } },
          create: { vocabularyId: vocab.id, mediaId: article.id, mediaType: 'ARTICLE' },
          update: {},
        })
      }

      // 4. Tạo quiz questions + options
      for (const q of body.quizQuestions) {
        await tx.articleQuizQuestion.create({
          data: {
            articleId: article.id,
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

      return article.id
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

  updateQuizQuestion(questionId: string, data: Prisma.ArticleQuizQuestionUpdateInput): Promise<ArticleQuizQuestion> {
    return this.prismaService.articleQuizQuestion.update({ where: { id: questionId }, data })
  }

  async deleteQuizQuestion(questionId: string): Promise<void> {
    // Xóa options trước do không có cascade
    await this.prismaService.articleQuizOption.deleteMany({ where: { questionId } })
    await this.prismaService.articleQuizQuestion.delete({ where: { id: questionId } })
  }
}
