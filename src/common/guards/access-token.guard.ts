import { REQUEST_USER_KEY } from '@/common/constants/auth.constant'
import { PrismaService } from '@/common/services/prisma.service'
import { TokenService } from '@/common/services/token.service'
import { AccessTokenPayload } from '@/common/types/jwt.type'
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // 1. Trích xuất và validate token
    const decodedAccessToken = await this.extractAndValidateToken(request)

    // 2. Kiểm tra xem User còn tồn tại/hoạt động trong DB không
    await this.validateUserStatus(decodedAccessToken.userId, request)

    return true
  }

  private async extractAndValidateToken(request: any): Promise<AccessTokenPayload> {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Error.MissingAccessToken')
    }

    const accessToken = authHeader.split(' ')[1]
    try {
      const decoded = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decoded // Lưu payload vào request
      return decoded
    } catch {
      throw new UnauthorizedException('Error.InvalidAccessToken')
    }
  }

  private async validateUserStatus(_userId: string, _request: any): Promise<void> {
    // const user = await this.prismaService.user.findUnique({
    //   where: {
    //     id: userId,
    //     // deletedAt: null,
    //   },
    //   select: { role: true, status: true },
    // })
    // if (!user) {
    //   throw new UnauthorizedException('Error.UserNotFound')
    // }
    // if (user.status === UserStatus.BLOCKED) {
    //   throw new ForbiddenException('Error.UserBlocked')
    // }
    // if (user.status === UserStatus.INACTIVE) {
    //   throw new UnauthorizedException('Error.UserInactive')
    // }
  }
}
