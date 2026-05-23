import { PrismaService } from '@/common/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { differenceInCalendarDays, isSameDay, startOfDay } from 'date-fns'

@Injectable()
export class UserStatRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async updateStreak(userId: string) {
    const stat = await this.prismaService.userStat.findUnique({ where: { userId } })
    const today = startOfDay(new Date())
    const lastLearn = stat?.lastLearnDate ? startOfDay(stat.lastLearnDate) : null

    // Đã học hôm nay rồi => không làm gì
    if (lastLearn && isSameDay(lastLearn, today)) return

    const isConsecutive = lastLearn && differenceInCalendarDays(today, lastLearn) === 1

    await this.prismaService.userStat.upsert({
      where: { userId },
      create: { userId, learningStreak: 1, lastLearnDate: today },
      update: {
        learningStreak: isConsecutive
          ? { increment: 1 } // hôm qua có học => tăng
          : 1, // bỏ ngày => reset
        lastLearnDate: today,
      },
    })
  }
}
