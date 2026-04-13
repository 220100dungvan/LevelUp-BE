import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AuthRepository } from '@/modules/auth/auth.repo'
import { UserModule } from '@/modules/user/user.module'

@Module({
  providers: [AuthService, AuthRepository],
  controllers: [AuthController],
  imports: [UserModule],
})
export class AuthModule {}
