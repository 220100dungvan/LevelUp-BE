import { UserRole } from '@/common/constants/auth.constant'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { IsPublic } from '@/common/decorators/auth.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  ArticleDetailResDTO,
  ArticleProgressBodyDTO,
  ArticleProgressResDTO,
  CreateArticleBodyDTO,
  CreateArticleResDTO,
  CreateQuizBodyDTO,
  GetArticleContentResDTO,
  GetArticleQuizResDTO,
  GetArticlesQueryDTO,
  GetArticlesResDTO,
  GetArticleTopicsResDTO,
  GetArticleVocabulariesResDTO,
  UpdateArticleBodyDTO,
  UpdateQuizQuestionBodyDTO,
} from '@/modules/article/article.dto'
import { ArticleService } from '@/modules/article/article.service'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

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

  @Get(':articleId')
  @IsPublic()
  @ZodResponse({ type: ArticleDetailResDTO })
  getArticleDetail(@Param('articleId') articleId: string) {
    return this.articleService.getArticleDetail(articleId)
  }

  //lấy riêng vocabularies
  @Get(':articleId/vocabularies')
  @IsPublic()
  @ZodResponse({ type: GetArticleVocabulariesResDTO })
  getArticleVocabularies(@Param('articleId') articleId: string) {
    return this.articleService.getArticleVocabularies(articleId)
  }

  //lấy riêng quiz
  @Get(':articleId/quiz')
  @IsPublic()
  @ZodResponse({ type: GetArticleQuizResDTO })
  getArticleQuiz(@Param('articleId') articleId: string) {
    return this.articleService.getArticleQuiz(articleId)
  }

  //lấy riêng nội dung bài
  @Get(':articleId/content')
  @IsPublic()
  @ZodResponse({ type: GetArticleContentResDTO })
  getArticleContent(@Param('articleId') articleId: string) {
    return this.articleService.getArticleContent(articleId)
  }

  @Post(':articleId/progress')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: ArticleProgressResDTO })
  updateProgress(
    @Param('articleId') articleId: string,
    @Body() body: ArticleProgressBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.articleService.updateProgress(userId, articleId, body)
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: CreateArticleResDTO })
  saveArticle(@Body() body: CreateArticleBodyDTO, @ActiveUser('userId') userId: string) {
    return this.articleService.createArticle(body, userId)
  }

  @Patch(':articleId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  updateArticle(@Param('articleId') articleId: string, @Body() body: UpdateArticleBodyDTO) {
    return this.articleService.adminUpdateArticle(articleId, body)
  }

  @Delete(':articleId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  deleteArticle(@Param('articleId') articleId: string) {
    return this.articleService.adminDeleteArticle(articleId)
  }

  // @Get(':articleId/quiz')
  // adminGetQuiz(@Param('articleId') articleId: string) {
  //   return this.articleService.adminGetQuiz(articleId)
  // }

  @Post(':articleId/quiz')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  createQuiz(@Param('articleId') articleId: string, @Body() body: CreateQuizBodyDTO) {
    return this.articleService.createQuiz(articleId, body)
  }

  @Patch('quiz/:questionId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ZodResponse({ type: MessageResDTO })
  updateQuizQuestion(@Param('questionId') questionId: string, @Body() body: UpdateQuizQuestionBodyDTO) {
    return this.articleService.updateQuizQuestion(questionId, body)
  }

  @Delete('quiz/:questionId')
  @ZodResponse({ type: MessageResDTO })
  deleteQuizQuestion(@Param('questionId') questionId: string) {
    return this.articleService.deleteQuizQuestion(questionId)
  }
}
