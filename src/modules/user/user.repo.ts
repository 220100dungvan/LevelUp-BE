import { PrismaService } from '@/common/services/prisma.service'
import { User } from '@/generated/prisma/client'
import { Injectable } from '@nestjs/common'

export type WhereUniqueUserType = { id: string; [key: string]: any } | { email: string; [key: string]: any }
@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(where: WhereUniqueUserType): Promise<User | null> {
    return this.prismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
    })
  }

  update(where: { id: string }, data: Partial<User>): Promise<Omit<User, 'password' | 'totpSecret'>> {
    return this.prismaService.user.update({
      where: {
        ...where,
        deletedAt: null,
      },
      data,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }
}
