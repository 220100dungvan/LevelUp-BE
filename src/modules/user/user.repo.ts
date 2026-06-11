import { PrismaService } from '@/common/services/prisma.service'
import { GetUsersQueryType } from '@/modules/user/user.schema'
import { Prisma, User } from '@/generated/prisma/client'
import { Injectable } from '@nestjs/common'

export type WhereUniqueUserType = { id: string; [key: string]: any } | { email: string; [key: string]: any }

const SAFE_USER_OMIT = { password: true, totpSecret: true } as const

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
      omit: SAFE_USER_OMIT,
    })
  }

  async findUniqueWithDetail(id: string) {
    return this.prismaService.user.findFirst({
      where: { id, deletedAt: null },
      omit: SAFE_USER_OMIT,
      include: {
        classMemberships: {
          where: { classRoom: { deletedAt: null } },
          orderBy: { joinedAt: 'desc' },
          include: {
            classRoom: {
              include: {
                teacher: {
                  select: { id: true, fullName: true, avatarUrl: true, email: true },
                },
                _count: { select: { members: true } },
              },
            },
          },
        },
      },
    })
  }

  async findMany(query: GetUsersQueryType): Promise<{
    data: Omit<User, 'password' | 'totpSecret'>[]
    total: number
  }> {
    const { page, limit, search, role, status } = query
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        omit: SAFE_USER_OMIT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.user.count({ where }),
    ])

    return { data, total }
  }
}
