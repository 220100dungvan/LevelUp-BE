import { Module } from '@nestjs/common'
import { LearningWordsController } from './learning-words.controller'
import { VocabularyController } from './vocabulary.controller'
import { VocabularyService } from './vocabulary.service'
import { VocabularyRepository } from '@/modules/vocabulary/vocabulary.repo'

@Module({
  controllers: [VocabularyController, LearningWordsController],
  providers: [VocabularyService, VocabularyRepository],
})
export class VocabularyModule {}
