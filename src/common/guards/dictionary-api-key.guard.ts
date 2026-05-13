import envConfig from '@/common/utils/config'
import { TokenService } from '@/common/services/token.service'
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class DictionaryAPIKeyGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const dictionaryAPIKey = request.headers['dictionary-api-key']
    if (dictionaryAPIKey === envConfig.DICTIONARY_API_KEY_SECRET) {
      return true
    }
    throw new UnauthorizedException()
  }
}
