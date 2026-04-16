import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { VocabularyModule } from './modules/vocabulary/vocabulary.module'

@Module({
  imports: [ConfigModule.forRoot(), CommonModule, AuthModule, UserModule, VocabularyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
