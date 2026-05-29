import { SKIP_APP_CHECK_KEY } from '@/common/constants/auth.constant'
import { FirebaseAdminService } from '@/common/services/firebase-admin.service'
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

// Decorator để bỏ qua guard ở một số route đặc biệt
export const SkipAppCheck = () => SetMetadata(SKIP_APP_CHECK_KEY, true)

@Injectable()
export class AppCheckGuard implements CanActivate {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Bỏ qua nếu có decorator @SkipAppCheck()
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_APP_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) return true

    const request = context.switchToHttp().getRequest()
    const appCheckToken = request.headers['x-firebase-appcheck']

    if (!appCheckToken) {
      throw new ForbiddenException('Missing App Check token')
    }

    try {
      await this.firebaseAdmin.getAppCheck().verifyToken(appCheckToken)
      return true
    } catch {
      throw new ForbiddenException('Invalid App Check token')
    }
  }
}
