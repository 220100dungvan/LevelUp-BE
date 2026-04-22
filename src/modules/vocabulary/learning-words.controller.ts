import { ActiveUser } from '@/common/decorators/active-user.decorator'
import {
  GetLearningProgressByListResDTO,
  GetLearningProgressOverviewQueryDTO,
  GetLearningProgressOverviewResDTO,
  SubmitLearningWordBodyDTO,
  SubmitLearningWordResDTO,
} from '@/modules/vocabulary/vocabulary.dto'
import { VocabularyService } from '@/modules/vocabulary/vocabulary.service'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('learning-words')
export class LearningWordsController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // Lấy thống kê tiến độ học tổng quan
  @Get('progress/overview')
  @ZodResponse({ type: GetLearningProgressOverviewResDTO })
  getLearningProgressOverview(
    @Query() query: GetLearningProgressOverviewQueryDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.vocabularyService.getLearningProgressOverview(userId, query)
  }

  // Lấy thống kê tiến độ học theo từng list
  @Get('progress/list/:listId')
  @ZodResponse({ type: GetLearningProgressByListResDTO })
  getLearningProgressByList(
    @Param('listId') listId: string,
    @Query() query: GetLearningProgressOverviewQueryDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.vocabularyService.getLearningProgressByList(userId, listId, query)
  }

  // Ghi nhận tiến độ học từng từ (Flashcard / Trắc nghiệm / Nghe từ vựng)
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: SubmitLearningWordResDTO })
  submit(@Body() body: SubmitLearningWordBodyDTO, @ActiveUser('userId') userId: string) {
    return this.vocabularyService.submitLearningWord(body, userId)
  }
}
