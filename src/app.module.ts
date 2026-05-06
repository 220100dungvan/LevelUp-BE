import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { VocabularyModule } from './modules/vocabulary/vocabulary.module'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import CustomZodValidationPipe from '@/common/pipes/custom-zod-validation.pipe'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter'
import { ProfileModule } from './modules/profile/profile.module'
import { VideoModule } from './modules/video/video.module'
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor'
import { DictationModule } from './modules/dictation/dictation.module'
import { VideoSessionModule } from '@/modules/video-session/video-session.module'
import { ShadowingModule } from './modules/shadowing/shadowing.module'
import { SpeakingModule } from './modules/speaking/speaking.module'
import { ArticleModule } from './modules/article/article.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    CommonModule,
    AuthModule,
    UserModule,
    VocabularyModule,
    ProfileModule,
    VideoModule,
    DictationModule,
    VideoSessionModule,
    ShadowingModule,
    SpeakingModule,
    ArticleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
