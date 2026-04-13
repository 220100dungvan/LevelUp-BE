import { Injectable } from '@nestjs/common'
import { Prisma, type Device, type RefreshToken, type User, type VerificationCode } from '@/generated/prisma/client'
import { TypeOfVerificationCodeType } from '@/common/constants/auth.constant'
import { PrismaService } from '@/common/services/prisma.service'

type CreateUserPayload = Pick<User, 'email' | 'password' | 'fullName'> &
  Partial<Pick<User, 'phoneNumber' | 'avatarUrl' | 'role' | 'status'>>

type VerificationCodeLookup =
  | { id: number }
  | {
      email_type: {
        email: string
        type: TypeOfVerificationCodeType
      }
    }

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // Query User
  async createUser(payload: CreateUserPayload): Promise<Omit<User, 'password' | 'totpSecret'>> {
    return this.prismaService.user.create({
      data: payload,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async findUniqueUser(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: {
        ...where,
        deletedAt: null,
      },
    })
  }

  // Query VerificationCode
  async createVerificationCode(
    payload: Pick<VerificationCode, 'email' | 'code' | 'type' | 'expiresAt'>,
  ): Promise<VerificationCode> {
    return this.prismaService.verificationCode.upsert({
      where: {
        email_type: {
          email: payload.email,
          type: payload.type,
        },
      },
      create: payload,
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
    })
  }

  async deleteVerificationCode(where: VerificationCodeLookup): Promise<VerificationCode | null> {
    if ('id' in where) {
      return this.prismaService.verificationCode.delete({
        where,
      })
    }

    const record = await this.prismaService.verificationCode.findFirst({
      where: {
        email: where.email_type.email,
        type: where.email_type.type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!record) {
      return null
    }

    return this.prismaService.verificationCode.delete({
      where: {
        id: record.id,
      },
    })
  }

  async findUniqueVerificationCode(where: VerificationCodeLookup): Promise<VerificationCode | null> {
    if ('id' in where) {
      return this.prismaService.verificationCode.findUnique({
        where,
      })
    }

    return this.prismaService.verificationCode.findFirst({
      where: {
        email: where.email_type.email,
        type: where.email_type.type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  // Query RefreshToken
  createRefreshToken(
    payload: Pick<RefreshToken, 'token' | 'userId' | 'deviceId' | 'expiresAt'>,
  ): Promise<RefreshToken> {
    return this.prismaService.refreshToken.create({
      data: payload,
    })
  }

  deleteRefreshToken(where: { token: string }): Promise<RefreshToken> {
    return this.prismaService.refreshToken.delete({
      where,
    })
  }

  async findUniqueRefreshTokenIncludeUser(where: { token: string }): Promise<(RefreshToken & { user: User }) | null> {
    return this.prismaService.refreshToken.findUnique({
      where,
      include: {
        user: true,
      },
    })
  }

  // Query Device
  createDevice(payload: Pick<Device, 'userId' | 'userAgent' | 'ip'>): Promise<Device> {
    return this.prismaService.device.create({
      data: {
        ...payload,
        lastActiveAt: new Date(),
      },
    })
  }

  updateDevice(deviceId: number, data: Prisma.DeviceUpdateInput): Promise<Device> {
    return this.prismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    })
  }
}
