import { PrismaService } from '@/common/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { User } from '@/generated/prisma/client'

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
}
