import { EmailService } from '@/common/emails/email.service'
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

const sharedServices = [
  PrismaService,
  TokenService,
  HashingService,
  EmailService,
  TwoFactorService,
  CloudinaryService,
  SpeechToTextService,
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
  ],
  exports: [...sharedServices],
  imports: [JwtModule],
})
export class CommonModule {}
