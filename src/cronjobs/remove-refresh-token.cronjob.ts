import { PrismaService } from '@/common/services/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class RemoveRefreshTokenService {
  private readonly logger = new Logger(RemoveRefreshTokenService.name)

  constructor(private readonly prismaService: PrismaService) {}

  @Cron('0 0 6 * * 0', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleCron() {
    this.logger.debug('Run every Sunday at 6:00 AM')
    const refreshTokens = await this.prismaService.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    this.logger.debug(`Deleted ${refreshTokens.count} expired refresh tokens`)
  }
}
