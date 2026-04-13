import { ROLES_TYPE_KEY, UserRoleType } from '@/common/constants/auth.constant'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(ROLES_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true // Nếu API không yêu cầu role cụ thể

    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.includes(user.role) // Kiểm tra role từ payload token
  }
}
