import { VOCAB_REVIEW_INTERVAL_DAYS, VocabStatus, VocabStatusType } from '@/common/constants/vocabulary.constant'
import { PrismaService } from '@/common/services/prisma.service'
import {
  CreateVocabularyBodyType,
  CreateVocabularyListBodyType,
  GetLearningProgressOverviewQueryType,
  GetListsQueryType,
  UpdateVocabularyListBodyType,
  CreateTopicBodyType,
  UpdateTopicBodyType,
} from '@/modules/vocabulary/vocabulary.schema'
import { Injectable } from '@nestjs/common'
import { startOfDay } from 'date-fns'

@Injectable()
export class VocabularyRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllTopics() {
    const data = await this.prismaService.vocabularyTopic.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return { data }
  }

  findTopicById(id: string) {
    return this.prismaService.vocabularyTopic.findFirst({
      where: { id, deletedAt: null },
    })
  }

  createTopic(payload: CreateTopicBodyType) {
    return this.prismaService.vocabularyTopic.create({
      data: {
        name: payload.name,
        description: payload.description,
        thumbnailUrl: payload.thumbnailUrl,
      },
    })
  }

  updateTopic(id: string, data: UpdateTopicBodyType) {
    return this.prismaService.vocabularyTopic.update({
      where: { id },
      data,
    })
  }

  softDeleteTopic(id: string) {
    return this.prismaService.vocabularyTopic.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async findLists(query: GetListsQueryType) {
    const { topicId, level, page, limit, search } = query

    const where = {
      deletedAt: null,
      topicId,
      level,
      name: search?.trim() ? { contains: search.trim(), mode: 'insensitive' as const } : undefined,
    }

    const [lists, total] = await Promise.all([
      this.prismaService.vocabularyList.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      this.prismaService.vocabularyList.count({ where }),
    ])

    const data = lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      level: list.level,
      isPublic: list.isPublic,
      createdAt: list.createdAt,
      totalWords: list._count.items,
      topic: list.topic,
      creator: list.creator,
    }))

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  findListWithItems(id: string) {
    return this.prismaService.vocabularyList.findUnique({
      where: { id, deletedAt: null },
      include: {
        topic: { select: { id: true, name: true, thumbnailUrl: true } },
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            vocabulary: true,
          },
        },
        _count: { select: { items: true } },
      },
    })
  }

  findListItemsForUser(listId: string, userId: string) {
    return this.prismaService.vocabularyListItem.findMany({
      where: { listId },
      orderBy: { orderIndex: 'asc' },
      include: {
        vocabulary: {
          include: {
            userProgress: {
              where: { userId, listId },
              take: 1,
            },
          },
        },
      },
    })
  }

  createList(payload: CreateVocabularyListBodyType & { createdBy: string }) {
    return this.prismaService.vocabularyList.create({
      data: {
        topicId: payload.topicId,
        name: payload.name,
        description: payload.description,
        level: payload.level,
        isPublic: payload.isPublic,
        createdBy: payload.createdBy,
      },
      include: {
        topic: { select: { id: true, name: true, thumbnailUrl: true } },
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { items: true } },
      },
    })
  }

  checkAccess(listId: string, userId: string) {
    return this.prismaService.vocabularyListAccess.findUnique({
      where: {
        listId_userId: { listId, userId },
      },
    })
  }

  findListById(id: string) {
    return this.prismaService.vocabularyList.findUnique({
      where: { id, deletedAt: null },
      include: {
        topic: { select: { id: true, name: true, thumbnailUrl: true } },
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { items: true } },
      },
    })
  }

  updateList(id: string, data: UpdateVocabularyListBodyType) {
    return this.prismaService.vocabularyList.update({
      where: { id },
      data,
      include: {
        topic: { select: { id: true, name: true, thumbnailUrl: true } },
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { items: true } },
      },
    })
  }

  softDeleteList(id: string) {
    return this.prismaService.vocabularyList.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  createVocabulary(payload: CreateVocabularyBodyType & { createdBy: string }) {
    return this.prismaService.vocabulary.create({
      data: {
        word: payload.word,
        phoneticUk: payload.phoneticUk,
        phoneticUs: payload.phoneticUs,
        partOfSpeech: payload.partOfSpeech,
        meaningVi: payload.meaningVi,
        meaningEn: payload.meaningEn,
        exampleEn: payload.exampleEn,
        exampleVi: payload.exampleVi,
        imageUrl: payload.imageUrl,
        audioUrlUk: payload.audioUrlUk,
        audioUrlUs: payload.audioUrlUs,
        audioExampleUrl: payload.audioExampleUrl,
        level: payload.level,
        createdBy: payload.createdBy,
      },
    })
  }

  findExistingListItems(listId: string, vocabularyIds: string[]) {
    return this.prismaService.vocabularyListItem.findMany({
      where: {
        listId,
        vocabularyId: { in: vocabularyIds },
      },
      select: { vocabularyId: true },
    })
  }

  async getMaxOrderIndex(listId: string): Promise<number> {
    const result = await this.prismaService.vocabularyListItem.aggregate({
      where: { listId },
      _max: { orderIndex: true },
    })
    return result._max.orderIndex ?? -1
  }

  addItemsToList(items: Array<{ listId: string; vocabularyId: string; orderIndex: number }>) {
    return this.prismaService.vocabularyListItem.createMany({
      data: items,
      skipDuplicates: true,
    })
  }

  removeItemFromList(listId: string, vocabularyId: string) {
    return this.prismaService.vocabularyListItem.delete({
      where: {
        listId_vocabularyId: { listId, vocabularyId },
      },
    })
  }

  async reorderItems(listId: string, orderedVocabularyIds: string[]) {
    const updates = orderedVocabularyIds.map((vocabularyId, index) =>
      this.prismaService.vocabularyListItem.update({
        where: { listId_vocabularyId: { listId, vocabularyId } },
        data: { orderIndex: index },
      }),
    )
    return this.prismaService.$transaction(updates)
  }

  findVocabularyById(id: string) {
    return this.prismaService.vocabulary.findUnique({
      where: { id, deletedAt: null },
    })
  }

  findUserProgress(userId: string, vocabularyId: string, listId: string) {
    return this.prismaService.userVocabularyProgress.findUnique({
      where: {
        userId_vocabularyId_listId: { userId, vocabularyId, listId },
      },
    })
  }

  upsertUserProgress(payload: {
    userId: string
    vocabularyId: string
    listId: string
    status: VocabStatusType
    isCorrect: boolean
  }) {
    const { userId, vocabularyId, listId, status, isCorrect } = payload
    const increment = isCorrect ? { correctCount: { increment: 1 } } : { wrongCount: { increment: 1 } }

    // Tính nextReviewAt theo spaced repetition đơn giản
    const nextReviewAt = this.calculateNextReview(status, isCorrect)

    return this.prismaService.userVocabularyProgress.upsert({
      where: { userId_vocabularyId_listId: { userId, vocabularyId, listId } },
      create: {
        userId,
        vocabularyId,
        listId,
        status: status,
        correctCount: isCorrect ? 1 : 0,
        wrongCount: isCorrect ? 0 : 1,
        lastReviewedAt: new Date(),
        nextReviewAt,
      },
      update: {
        status: status,
        ...increment,
        lastReviewedAt: new Date(),
        nextReviewAt,
      },
    })
  }

  private calculateNextReview(status: VocabStatusType, isCorrect: boolean): Date | null {
    if (!isCorrect) return new Date() // review lại ngay
    const now = new Date()
    const days = VOCAB_REVIEW_INTERVAL_DAYS[status] ?? 1
    if (days === 0) return null
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  }

  // Upsert UserLearningDaily stats
  async updateLearningDaily(userId: string, listId: string, isCorrect: boolean, isNewWord: boolean) {
    const today = startOfDay(new Date())

    return this.prismaService.userLearningDaily.upsert({
      where: { userId_listId_date: { userId, listId, date: today } },
      create: {
        userId,
        listId,
        date: today,
        wordsLearned: isNewWord ? 1 : 0,
        wordsReviewed: isNewWord ? 0 : 1,
        correctCount: isCorrect ? 1 : 0,
        wrongCount: isCorrect ? 0 : 1,
      },
      update: {
        wordsLearned: isNewWord ? { increment: 1 } : undefined,
        wordsReviewed: !isNewWord ? { increment: 1 } : undefined,
        correctCount: isCorrect ? { increment: 1 } : undefined,
        wrongCount: !isCorrect ? { increment: 1 } : undefined,
      },
    })
  }

  // Upsert UserListProgress
  async updateListProgress(userId: string, listId: string) {
    const [totalItems, masteredItems] = await Promise.all([
      this.prismaService.vocabularyListItem.count({ where: { listId } }),
      this.prismaService.userVocabularyProgress.count({
        where: { userId, listId, status: { in: ['EASY', 'MEDIUM', 'MASTERED'] } },
      }),
    ])

    const progressPct = totalItems > 0 ? (masteredItems / totalItems) * 100 : 0
    const completed = progressPct >= 100

    return this.prismaService.userListProgress.upsert({
      where: { userId_listId: { userId, listId } },
      create: {
        userId,
        listId,
        progressPct,
        completed,
        lastLearnedAt: new Date(),
      },
      update: {
        progressPct,
        completed,
        lastLearnedAt: new Date(),
      },
    })
  }

  // Cập nhật UserStat
  async updateUserStat(userId: string, isCorrect: boolean, isNewWord: boolean) {
    return this.prismaService.userStat.upsert({
      where: { userId },
      create: {
        userId,
        totalWordsLearned: isNewWord ? 1 : 0,
        totalReviews: 1,
        totalMastered: 0,
        totalNeedReview: 0,
      },
      update: {
        totalWordsLearned: isNewWord ? { increment: 1 } : undefined,
        totalReviews: { increment: 1 },
      },
    })
  }

  async getLearningProgressOverview(userId: string, query: GetLearningProgressOverviewQueryType) {
    const days = query.days ?? 180
    const startDate = this.buildStartDate(days)

    const [learnedWords, rememberedWords, heatmapRows] = await Promise.all([
      this.prismaService.userVocabularyProgress.count({
        where: { userId },
      }),
      this.prismaService.userVocabularyProgress.count({
        where: { userId, status: VocabStatus.Mastered },
      }),
      this.prismaService.userLearningDaily.groupBy({
        by: ['date'],
        where: {
          userId,
          date: { gte: startDate },
        },
        _sum: {
          wordsLearned: true,
          wordsReviewed: true,
          correctCount: true,
          wrongCount: true,
        },
        orderBy: { date: 'asc' },
      }),
    ])

    const needReviewWords = learnedWords - rememberedWords

    return {
      summary: {
        learnedWords,
        rememberedWords,
        needReviewWords,
      },
      heatmap: heatmapRows.map((row) => ({
        date: row.date,
        learnedCount: row._sum.wordsLearned ?? 0,
        reviewedCount: row._sum.wordsReviewed ?? 0,
        correctCount: row._sum.correctCount ?? 0,
        wrongCount: row._sum.wrongCount ?? 0,
        totalActivity: (row._sum.wordsLearned ?? 0) + (row._sum.wordsReviewed ?? 0),
      })),
    }
  }

  async getLearningProgressByList(userId: string, listId: string, query: GetLearningProgressOverviewQueryType) {
    const days = query.days ?? 180
    const startDate = this.buildStartDate(days)

    const [totalWordsInList, learnedWords, rememberedWords, heatmapRows] = await Promise.all([
      this.prismaService.vocabularyListItem.count({
        where: { listId },
      }),
      this.prismaService.userVocabularyProgress.count({
        where: { userId, listId },
      }),
      this.prismaService.userVocabularyProgress.count({
        where: { userId, listId, status: VocabStatus.Mastered },
      }),
      this.prismaService.userLearningDaily.groupBy({
        by: ['date'],
        where: {
          userId,
          listId,
          date: {
            gte: startDate,
          },
        },
        _sum: {
          wordsLearned: true,
          wordsReviewed: true,
          correctCount: true,
          wrongCount: true,
        },
        orderBy: { date: 'asc' },
      }),
    ])

    const needReviewWords = learnedWords - rememberedWords

    return {
      summary: {
        totalWordsInList,
        learnedWords,
        rememberedWords,
        needReviewWords,
      },
      heatmap: heatmapRows.map((row) => ({
        date: row.date,
        learnedCount: row._sum.wordsLearned ?? 0,
        reviewedCount: row._sum.wordsReviewed ?? 0,
        correctCount: row._sum.correctCount ?? 0,
        wrongCount: row._sum.wrongCount ?? 0,
        totalActivity: (row._sum.wordsLearned ?? 0) + (row._sum.wordsReviewed ?? 0),
      })),
    }
  }

  private buildStartDate(days: number): Date {
    const startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)
    startDate.setDate(startDate.getDate() - Math.max(days - 1, 0))
    return startDate
  }
}
