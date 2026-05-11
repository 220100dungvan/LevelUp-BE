import { UserRole, type UserRoleType } from '@/common/constants/auth.constant'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { IsPublic } from '@/common/decorators/auth.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  ArticleProgressBodyDTO,
  ArticleProgressResDTO,
  CreateArticleBodyDTO,
  CreateArticleResDTO,
  CreateArticleVocabulariesBodyDTO,
  CreateQuizBodyDTO,
  GetAllArticleQuizAttemptsResDTO,
  GetArticleQuizAttemptResDTO,
  GetArticleContentResDTO,
  GetArticleQuizResDTO,
  GetArticlesQueryDTO,
  GetArticlesResDTO,
  GetArticleTopicsResDTO,
  GetArticleVocabulariesResDTO,
  StartArticleQuizResDTO,
  SubmitArticleQuizBodyDTO,
  SubmitArticleQuizResDTO,
  UpdateArticleBodyDTO,
  UpdateQuizQuestionBodyDTO,
} from '@/modules/article/article.dto'
import { ArticleService } from '@/modules/article/article.service'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'
import { ZodResponse } from 'nestjs-zod'
import {
  optionalImageFileValidationPipe,
  requiredImageFileValidationPipe,
} from '@/common/pipes/image-file-validation.pipe'

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get('topics')
  @IsPublic()
  @ZodResponse({ type: GetArticleTopicsResDTO })
  getTopics() {
    return this.articleService.getTopics()
  }

  @Get()
  @IsPublic()
  @ZodResponse({ type: GetArticlesResDTO })
  getArticles(@Query() query: GetArticlesQueryDTO) {
    return this.articleService.getArticles(query)
  }

  //lấy riêng vocabularies
  @Get(':articleId/vocabularies')
  @ZodResponse({ type: GetArticleVocabulariesResDTO })
  getArticleVocabularies(@Param('articleId', new ParseUUIDPipe()) articleId: string) {
    return this.articleService.getArticleVocabularies(articleId)
  }

  //lấy riêng quiz
  @Get(':articleId/quiz')
  @ZodResponse({ type: GetArticleQuizResDTO })
  getArticleQuiz(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.articleService.getArticleQuiz(articleId, userId, role)
  }

  @Get(':articleId/quiz/attempts/:attemptId')
  @ZodResponse({ type: GetArticleQuizAttemptResDTO })
  getQuizAttemptById(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @ActiveUser('userId') userId: string,
  ) {
    return this.articleService.findQuizAttemptById(attemptId, userId, articleId)
  }

  @Post(':articleId/quiz/start')
  @ZodResponse({ type: StartArticleQuizResDTO })
  startArticleQuiz(@Param('articleId', new ParseUUIDPipe()) articleId: string, @ActiveUser('userId') userId: string) {
    return this.articleService.startArticleQuiz(userId, articleId)
  }

  @Get(':articleId/quiz/attempts')
  @ZodResponse({ type: GetAllArticleQuizAttemptsResDTO })
  getAllQuizAttempts(@Param('articleId', new ParseUUIDPipe()) articleId: string, @ActiveUser('userId') userId: string) {
    return this.articleService.getAllQuizAttempts(userId, articleId)
  }

  @Post(':articleId/quiz/submit')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: SubmitArticleQuizResDTO })
  submitArticleQuiz(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() body: SubmitArticleQuizBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.articleService.submitArticleQuiz(userId, articleId, body)
  }

  //lấy riêng nội dung bài
  @Get(':articleId/content')
  @IsPublic()
  @ZodResponse({ type: GetArticleContentResDTO })
  getArticleContent(@Param('articleId', new ParseUUIDPipe()) articleId: string) {
    return this.articleService.getArticleContent(articleId)
  }

  @Post(':articleId/progress')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: ArticleProgressResDTO })
  updateProgress(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() body: ArticleProgressBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.articleService.updateProgress(userId, articleId, body)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ZodResponse({ type: CreateArticleResDTO })
  createArticle(
    @UploadedFile(requiredImageFileValidationPipe)
    thumbnail: UploadedFileData | undefined,
    @Body() body: CreateArticleBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.articleService.createArticle(body, userId, thumbnail)
  }

  @Post(':articleId/vocabularies')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  createArticleVocabularies(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() body: CreateArticleVocabulariesBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.articleService.createArticleVocabularies(articleId, body, userId, role)
  }

  @Patch(':articleId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ZodResponse({ type: MessageResDTO })
  updateArticle(
    @UploadedFile(optionalImageFileValidationPipe) thumbnail: UploadedFileData | undefined,
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() body: UpdateArticleBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.articleService.updateArticle(articleId, body, userId, thumbnail)
  }

  @Delete(':articleId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  deleteArticle(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.articleService.adminDeleteArticle(articleId, userId, role)
  }

  @Post(':articleId/quiz')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  createQuiz(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() body: CreateQuizBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.articleService.createQuiz(articleId, body, userId, role)
  }

  @Patch('quiz/:questionId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  updateQuizQuestion(
    @Param('questionId', new ParseUUIDPipe()) questionId: string,
    @Body() body: UpdateQuizQuestionBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.articleService.updateQuizQuestion(questionId, body, userId, role)
  }

  @Delete('quiz/:questionId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  deleteQuizQuestion(
    @Param('questionId', new ParseUUIDPipe()) questionId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.articleService.deleteQuizQuestion(questionId, userId, role)
  }
}
