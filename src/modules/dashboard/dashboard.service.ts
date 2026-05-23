import { DAILY_WORD_GOAL } from '@/common/constants/user.constant'
import { DashboardRepository } from '@/modules/dashboard/dashboard.repo'
import {
  BreakdownItemType,
  BreakdownResType,
  TodayProgressResType,
  WeeklyActivityResType,
} from '@/modules/dashboard/dashboard.schema'
import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getTodayProgress(userId: string): Promise<TodayProgressResType> {
    const [wordStats, finishedSessions, userStat] = await Promise.all([
      this.dashboardRepository.getTodayWordStats(userId),
      this.dashboardRepository.getTodayFinishedSessions(userId),
      this.dashboardRepository.getUserStat(userId),
    ])

    const totalActivity = wordStats.wordsLearned + wordStats.wordsReviewed
    const progressPct = Math.min(100, Math.round((totalActivity / DAILY_WORD_GOAL) * 100))

    return {
      wordsLearned: wordStats.wordsLearned,
      wordsReviewed: wordStats.wordsReviewed,
      dailyGoal: DAILY_WORD_GOAL,
      progressPct,
      lessonsCompleted: finishedSessions,
      streak: userStat?.learningStreak ?? 0,
    }
  }

  async getBreakdown(userId: string): Promise<BreakdownResType> {
    const [wordStats, dictationCount, shadowingCount, articlesRead] = await Promise.all([
      this.dashboardRepository.getTodayWordStats(userId),
      this.dashboardRepository.getTodayDictationSentences(userId),
      this.dashboardRepository.getTodayShadowingSentences(userId),
      this.dashboardRepository.getTodayArticlesRead(userId),
    ])

    const vocabTotal = wordStats.wordsLearned + wordStats.wordsReviewed

    const items: BreakdownItemType[] = [
      {
        key: 'dictation',
        label: 'Dictation',
        value: dictationCount,
        unit: 'sentences',
      },
      {
        key: 'shadowing',
        label: 'Shadowing',
        value: shadowingCount,
        unit: 'sentences',
      },
      {
        key: 'vocabulary',
        label: 'Vocabulary',
        value: vocabTotal,
        unit: 'words',
      },
      {
        key: 'reading',
        label: 'Reading',
        value: articlesRead,
        unit: 'articles',
      },
    ]

    return { items }
  }

  async getWeeklyActivity(userId: string): Promise<WeeklyActivityResType> {
    const [wordStatsByDay, sentencesByDay] = await Promise.all([
      this.dashboardRepository.getLast7DaysWordStats(userId),
      this.dashboardRepository.getLast7DaysSentencesByDay(userId),
    ])

    const days = wordStatsByDay.map((day) => {
      const dateKey = format(day.date, 'yyyy-MM-dd')
      return {
        date: dateKey,
        label: format(day.date, 'EEE'), // "Mon", "Tue", …
        wordsLearned: day.wordsLearned + day.wordsReviewed,
        sentencesPracticed: sentencesByDay.get(dateKey) ?? 0,
      }
    })

    const totalWords = days.reduce((s, d) => s + d.wordsLearned, 0)
    const totalSentences = days.reduce((s, d) => s + d.sentencesPracticed, 0)
    const n = days.length || 1

    return {
      days,
      avgWordsPerDay: Math.round(totalWords / n),
      avgSentencesPerDay: Math.round(totalSentences / n),
    }
  }
}
