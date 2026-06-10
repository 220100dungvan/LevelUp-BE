import { Module } from '@nestjs/common'
import { DictionaryController } from './dictionary.controller'
import { DictionaryService } from './dictionary.service'
import { VocabularyModule } from '@/modules/vocabulary/vocabulary.module'

@Module({
  controllers: [DictionaryController],
  providers: [DictionaryService],
  imports: [VocabularyModule],
})
export class DictionaryModule {}
