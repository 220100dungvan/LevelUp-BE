import envConfig from '@/common/config'
import { TokenService } from '@/common/services/token.service'
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class APIKeyGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const xAPIKey = request.headers['x-api-key']
    if (xAPIKey === envConfig.API_KEY_SECRET) {
      return true
    }
    throw new UnauthorizedException()
  }
}
