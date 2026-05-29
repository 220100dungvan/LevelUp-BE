import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '@/common/services/prisma.service'
import { EmailService } from '@/common/emails/email.service'
import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns'

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name)

  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Chạy lúc 20:00 mỗi ngày.
   * Gửi nhắc nhở cho user có streak > 0 nhưng chưa học hôm nay.
   */
  @Cron('0 20 * * *')
  async sendStreakAtRiskEmails() {
    this.logger.log('Running streak-at-risk cron...')
    const today = startOfDay(new Date())

    const usersAtRisk = await this.prismaService.userStat.findMany({
      where: {
        learningStreak: { gt: 0 },
        // lastLearnDate < hôm nay  => chưa học hôm nay
        OR: [{ lastLearnDate: { lt: today } }, { lastLearnDate: null }],
      },
      select: {
        learningStreak: true,
        user: { select: { email: true, fullName: true } },
      },
    })

    this.logger.log(`Sending streak-at-risk to ${usersAtRisk.length} users`)

    for (const stat of usersAtRisk) {
      await this.emailService.sendStreakAtRisk({
        email: stat.user.email,
        name: stat.user.fullName ?? 'bạn',
        streak: stat.learningStreak,
      })
    }
  }

  /**
   * Chạy lúc 10:00 mỗi ngày.
   * Gửi email comeback cho user bỏ học >= 2 ngày.
   */
  @Cron('0 10 * * *')
  async sendComebackEmails() {
    this.logger.log('Running comeback cron...')
    const today = startOfDay(new Date())
    const twoDaysAgo = subDays(today, 2)

    const inactiveUsers = await this.prismaService.userStat.findMany({
      where: {
        OR: [{ lastLearnDate: { lte: twoDaysAgo } }, { lastLearnDate: null }],
      },
      select: {
        lastLearnDate: true,
        user: { select: { email: true, fullName: true } },
      },
    })

    this.logger.log(`Sending comeback emails to ${inactiveUsers.length} users`)

    for (const stat of inactiveUsers) {
      const daysMissed = stat.lastLearnDate ? differenceInCalendarDays(today, stat.lastLearnDate) : 0

      await this.emailService.sendStreakComeback({
        email: stat.user.email,
        name: stat.user.fullName ?? 'bạn',
        daysMissed,
      })
    }
  }
}
