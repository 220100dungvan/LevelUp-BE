import { AccessTokenGuard } from '@/common/guards/access-token.guard'
import { APIKeyGuard } from '@/common/guards/api-key.guard'
import { AuthenticationGuard } from '@/common/guards/authentication.guard'
import { TwoFactorService } from '@/common/services/2fa.service'
import { HashingService } from '@/common/services/hashing.service'
import { PrismaService } from '@/common/services/prisma.service'
import { TokenService } from '@/common/services/token.service'
import { CloudinaryService } from '@/common/services/cloudinary.service'
import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { SpeechToTextService } from '@/common/services/speech-to-text.service'
import { DictionaryAPIKeyGuard } from '@/common/guards/dictionary-api-key.guard'
import { EmailModule } from '@/common/emails/email.module'
import { RedisModule } from '@/common/redis/redis.module'
import { UserStatRepository } from '@/common/repositories/user-stat.repo'
import { FirebaseAdminService } from '@/common/services/firebase-admin.service'
import { AppCheckGuard } from '@/common/guards/app-check.guard'

const sharedServices = [
  FirebaseAdminService,
  PrismaService,
  TokenService,
  HashingService,
  TwoFactorService,
  CloudinaryService,
  SpeechToTextService,
  UserStatRepository,
]

@Global()
@Module({
  providers: [
    ...sharedServices,
    APIKeyGuard,
    AccessTokenGuard,
    DictionaryAPIKeyGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AppCheckGuard,
    },
  ],
  exports: [...sharedServices, EmailModule, RedisModule],
  imports: [JwtModule, EmailModule, RedisModule],
})
export class CommonModule {}
