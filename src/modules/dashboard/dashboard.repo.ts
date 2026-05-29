import { PrismaService } from '@/common/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { endOfDay, format, startOfDay, subDays } from 'date-fns'

@Injectable()
export class DashboardRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private get todayRange() {
    return { gte: startOfDay(new Date()), lte: endOfDay(new Date()) }
  }

  // Lấy số lượng từ đã học và đã ôn tập trong ngày hôm nay
  async getTodayWordStats(userId: string): Promise<{ wordsLearned: number; wordsReviewed: number }> {
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const result = await this.prismaService.userLearningDaily.aggregate({
      where: {
        userId,
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: {
        wordsLearned: true,
        wordsReviewed: true,
      },
    })

    return {
      wordsLearned: result._sum.wordsLearned ?? 0,
      wordsReviewed: result._sum.wordsReviewed ?? 0,
    }
  }

  // Lấy số video learning sessions đã hoàn thành trong ngày hôm nay
  async getTodayFinishedSessions(userId: string): Promise<number> {
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    return this.prismaService.userLearningSession.count({
      where: {
        userId,
        finishedAt: { gte: todayStart, lte: todayEnd },
      },
    })
  }

  // Lấy thông tin user stat (để lấy streak)
  async getUserStat(userId: string) {
    return this.prismaService.userStat.findUnique({
      where: { userId },
    })
  }

  async getTodayDictationSentences(userId: string): Promise<number> {
    return this.prismaService.userDictationResult.count({
      where: {
        OR: [{ updatedAt: this.todayRange }, { createdAt: this.todayRange }],
        session: {
          userId,
        },
      },
    })
  }

  async getTodayShadowingSentences(userId: string): Promise<number> {
    return this.prismaService.userShadowingResult.count({
      where: {
        OR: [{ updatedAt: this.todayRange }, { createdAt: this.todayRange }],
        session: {
          userId,
        },
      },
    })
  }

  async getTodayArticlesRead(userId: string): Promise<number> {
    return this.prismaService.userArticleProgress.count({
      where: {
        userId,
        lastReadAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
    })
  }

  // Lấy số lượng từ đã học và ôn tập trong 7 ngày gần nhất
  async getLast7DaysWordStats(
    userId: string,
  ): Promise<Array<{ date: Date; wordsLearned: number; wordsReviewed: number }>> {
    const today = startOfDay(new Date())
    const sevenDaysAgo = subDays(today, 6)

    const rows = await this.prismaService.userLearningDaily.groupBy({
      by: ['date'],
      where: {
        userId,
        date: { gte: sevenDaysAgo, lte: endOfDay(new Date()) },
      },
      _sum: {
        wordsLearned: true,
        wordsReviewed: true,
      },
      orderBy: { date: 'asc' },
    })

    // Build a full 7-day map (fill zeros for missing days)
    const map = new Map<string, { wordsLearned: number; wordsReviewed: number }>()
    for (const row of rows) {
      const key = format(row.date, 'yyyy-MM-dd')
      map.set(key, {
        wordsLearned: row._sum.wordsLearned ?? 0,
        wordsReviewed: row._sum.wordsReviewed ?? 0,
      })
    }

    const result: Array<{ date: Date; wordsLearned: number; wordsReviewed: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i)
      const key = format(d, 'yyyy-MM-dd')
      const stats = map.get(key) ?? { wordsLearned: 0, wordsReviewed: 0 }
      result.push({ date: d, ...stats })
    }
    return result
  }

  async getLast7DaysSentencesByDay(userId: string): Promise<Map<string, number>> {
    const sevenDaysAgo = subDays(startOfDay(new Date()), 6)

    const [dictationResults, shadowingResults] = await Promise.all([
      this.prismaService.userDictationResult.findMany({
        where: {
          session: { userId },
          OR: [{ createdAt: { gte: sevenDaysAgo } }, { updatedAt: { gte: sevenDaysAgo } }],
        },
        select: { id: true, createdAt: true, updatedAt: true },
      }),
      this.prismaService.userShadowingResult.findMany({
        where: {
          session: { userId },
          OR: [{ createdAt: { gte: sevenDaysAgo } }, { updatedAt: { gte: sevenDaysAgo } }],
        },
        select: { id: true, createdAt: true, updatedAt: true },
      }),
    ])
    const sentencesByDay = new Map<string, number>()

    // Initialize map with the last 7 days (keys in yyyy-MM-dd)
    for (let i = 6; i >= 0; i--) {
      const d = subDays(startOfDay(new Date()), i)
      sentencesByDay.set(format(d, 'yyyy-MM-dd'), 0)
    }

    const addResult = (r: { id: number; createdAt: Date; updatedAt: Date | null }) => {
      if (!r) return
      const created: Date = r.createdAt
      const updated: Date | null = r.updatedAt
      const used = updated && created ? (updated > created ? updated : created) : (created ?? updated)
      if (!used) return
      const key = format(used, 'yyyy-MM-dd')
      if (sentencesByDay.has(key)) sentencesByDay.set(key, (sentencesByDay.get(key) ?? 0) + 1)
    }

    for (const r of dictationResults) addResult(r)
    for (const r of shadowingResults) addResult(r)

    return sentencesByDay
  }
}
