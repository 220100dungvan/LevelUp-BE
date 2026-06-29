import { PrismaService } from '@/common/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { User } from '@/generated/prisma/client'
import { OnboardingBodyType, UpdateLevelBodyType } from '@/modules/profile/profile.schema'

@Injectable()
export class ProfileRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findProfileByUserId(userId: string): Promise<Omit<User, 'password' | 'totpSecret'> | null> {
    return this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async completeOnboarding(userId: string, data: OnboardingBodyType): Promise<Omit<User, 'password' | 'totpSecret'>> {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        level: data.level,
        isOnboarded: true,
      },
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async updateLevel(userId: string, data: UpdateLevelBodyType): Promise<Omit<User, 'password' | 'totpSecret'>> {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { level: data.level },
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }
}
