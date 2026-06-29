import { VOCAB_REVIEW_INTERVAL_DAYS, VocabStatus, VocabStatusType } from '@/common/constants/vocabulary.constant'
import { PrismaService } from '@/common/services/prisma.service'
import {
  CreateVocabularyBodyType,
  CreateVocabularyListBodyType,
  GetLearningProgressOverviewQueryType,
  GetListsQueryType,
  UpdateVocabularyListBodyType,
  UpdateVocabularyTopicBodyType,
  SearchVocabularyQueryType,
  CreateVocabularyTopicBodyType,
  UpdateVocabularyBodyType,
  GetWordsAdminQueryType,
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

  createTopic(payload: CreateVocabularyTopicBodyType, thumbnailUrl: string) {
    return this.prismaService.vocabularyTopic.create({
      data: {
        name: payload.name,
        description: payload.description,
        thumbnailUrl,
      },
    })
  }

  updateTopic(id: string, data: UpdateVocabularyTopicBodyType, thumbnailUrl?: string) {
    return this.prismaService.vocabularyTopic.update({
      where: { id },
      data: {
        ...data,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      },
    })
  }

  softDeleteTopic(id: string) {
    return this.prismaService.vocabularyTopic.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  // Lấy danh sách words cho admin + stats trong một lần gọi
  async findWordsForAdmin(query: GetWordsAdminQueryType) {
    const { page, limit, search, level, partOfSpeech } = query

    const where = {
      deletedAt: null,
      ...(level ? { level } : {}),
      ...(partOfSpeech ? { partOfSpeech } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { word: { contains: search.trim(), mode: 'insensitive' as const } },
              { meaningVi: { contains: search.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    // Chạy song song: list page + total + stats aggregation
    const [words, total, statsRaw] = await Promise.all([
      this.prismaService.vocabulary.findMany({
        where,
        orderBy: { word: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          word: true,
          meaningVi: true,
          phoneticUk: true,
          phoneticUs: true,
          partOfSpeech: true,
          meaningEn: true,
          exampleEn: true,
          exampleVi: true,
          imageUrl: true,
          audioUrlUk: true,
          audioUrlUs: true,
          audioExampleUrl: true,
          level: true,
          createdAt: true,
        },
      }),
      this.prismaService.vocabulary.count({ where }),
      // Stats luôn dựa trên TOÀN BỘ bảng (không filter) để stat cards không thay đổi khi search
      this.getWordsStats(),
    ])

    return {
      data: words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statsRaw,
    }
  }

  // Tính stats cho Vocabulary Words dashboard
  async getWordsStats() {
    const baseWhere = { deletedAt: null }

    const [total, hasAudio, hasImage, hasIpa, byLevelRaw, byPosRaw] = await Promise.all([
      // Tổng words
      this.prismaService.vocabulary.count({ where: baseWhere }),

      // Có ít nhất 1 audio (uk hoặc us)
      this.prismaService.vocabulary.count({
        where: { ...baseWhere, OR: [{ audioUrlUk: { not: null } }, { audioUrlUs: { not: null } }] },
      }),

      // Có ảnh
      this.prismaService.vocabulary.count({
        where: { ...baseWhere, imageUrl: { not: null } },
      }),

      // Có IPA (uk hoặc us)
      this.prismaService.vocabulary.count({
        where: { ...baseWhere, OR: [{ phoneticUk: { not: null } }, { phoneticUs: { not: null } }] },
      }),

      // Đếm theo level — groupBy trả về array [{ level, _count }]
      this.prismaService.vocabulary.groupBy({
        by: ['level'],
        where: { ...baseWhere, level: { not: null } },
        _count: { _all: true },
      }),

      // Đếm theo partOfSpeech
      this.prismaService.vocabulary.groupBy({
        by: ['partOfSpeech'],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { _count: { partOfSpeech: 'desc' } },
      }),
    ])

    // Normalize byLevel thành object cố định
    const byLevel = { BEGINNER: 0, ELEMENTARY: 0, INTERMEDIATE: 0, UPPER_INTER: 0, ADVANCED: 0, MASTERY: 0 }
    for (const row of byLevelRaw) {
      if (row.level) byLevel[row.level as keyof typeof byLevel] = row._count._all
    }

    const byPartOfSpeech = Object.fromEntries(byPosRaw.map((row) => [row.partOfSpeech.toLowerCase(), row._count._all]))

    return { total, hasAudio, hasImage, hasIpa, byLevel, byPartOfSpeech }
  }

  // Cập nhật thông tin word (không bao gồm image — dùng endpoint riêng)
  async updateVocabulary(id: string, data: UpdateVocabularyBodyType) {
    return this.prismaService.vocabulary.update({
      where: { id },
      data,
    })
  }

  // Soft delete word — sẽ không xóa khỏi list items (tùy chính sách)
  async softDeleteVocabulary(id: string) {
    return this.prismaService.vocabulary.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async findLists(query: GetListsQueryType) {
    const { topicId, level, page, limit, search } = query

    const where = {
      deletedAt: null,
      topicId,
      isPublic: true,
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

  async findListsForAdmin(query: GetListsQueryType) {
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

  createVocabulary(
    payload: CreateVocabularyBodyType & {
      createdBy: string
      imageUrl?: string
      audioUrlUk?: string
      audioUrlUs?: string
    },
  ) {
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

  searchVocabularies(query: SearchVocabularyQueryType) {
    return this.prismaService.vocabulary.findMany({
      where: {
        deletedAt: null,
        word: { contains: query.word.trim(), mode: 'insensitive' },
      },
      orderBy: { word: 'asc' },
      take: query.limit,
      select: {
        id: true,
        word: true,
        phoneticUk: true,
        phoneticUs: true,
        partOfSpeech: true,
        meaningVi: true,
        meaningEn: true,
        exampleEn: true,
        exampleVi: true,
        imageUrl: true,
        audioUrlUk: true,
        audioUrlUs: true,
        audioExampleUrl: true,
        level: true,
      },
    })
  }

  async findListsByOwner(userId: string, query: GetListsQueryType) {
    const { topicId, level, page, limit, search } = query

    const where = {
      deletedAt: null,
      createdBy: userId,
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

  private buildStartDate(days: number): Date {
    const startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)
    startDate.setDate(startDate.getDate() - Math.max(days - 1, 0))
    return startDate
  }
}
