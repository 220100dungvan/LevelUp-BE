import { Module } from '@nestjs/common'
import { LearningWordsController } from './learning-words.controller'
import { VocabularyController } from './vocabulary.controller'
import { VocabularyService } from './vocabulary.service'
import { VocabularyRepository } from '@/modules/vocabulary/vocabulary.repo'
import { VocabularyIndexService } from '@/modules/vocabulary/vocabulary-index.service'

@Module({
  controllers: [VocabularyController, LearningWordsController],
  providers: [VocabularyService, VocabularyRepository, VocabularyIndexService],
  exports: [VocabularyIndexService],
})
export class VocabularyModule {}
