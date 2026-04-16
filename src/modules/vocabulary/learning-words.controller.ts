import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { SubmitLearningWordBodyDTO, SubmitLearningWordResDTO } from '@/modules/vocabulary/vocabulary.dto'
import { VocabularyService } from '@/modules/vocabulary/vocabulary.service'
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('learning-words')
export class LearningWordsController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // Ghi nhận tiến độ học từng từ (Flashcard / Trắc nghiệm / Nghe từ vựng)
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: SubmitLearningWordResDTO })
  submit(@Body() body: SubmitLearningWordBodyDTO, @ActiveUser('userId') userId: string) {
    return this.vocabularyService.submitLearningWord(body, userId)
  }
}
