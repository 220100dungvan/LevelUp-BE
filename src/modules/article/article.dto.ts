import {
  ArticleDetailResSchema,
  ArticleProgressBodySchema,
  ArticleProgressResSchema,
  CreateArticleBodySchema,
  CreateArticleResSchema,
  CreateQuizBodySchema,
  GetArticleContentResSchema,
  GetArticleQuizResSchema,
  GetArticlesQuerySchema,
  GetArticlesResSchema,
  GetArticleTopicsResSchema,
  GetArticleVocabulariesResSchema,
  StartArticleQuizResSchema,
  SubmitArticleQuizBodySchema,
  SubmitArticleQuizResSchema,
  UpdateArticleBodySchema,
  UpdateQuizQuestionSchema,
} from '@/modules/article/article.schema'
import { createZodDto } from 'nestjs-zod'

export class GetArticleTopicsResDTO extends createZodDto(GetArticleTopicsResSchema) {}

export class GetArticlesResDTO extends createZodDto(GetArticlesResSchema) {}
export class GetArticlesQueryDTO extends createZodDto(GetArticlesQuerySchema) {}

export class ArticleDetailResDTO extends createZodDto(ArticleDetailResSchema) {}

export class GetArticleVocabulariesResDTO extends createZodDto(GetArticleVocabulariesResSchema) {}
export class GetArticleQuizResDTO extends createZodDto(GetArticleQuizResSchema) {}

export class StartArticleQuizResDTO extends createZodDto(StartArticleQuizResSchema) {}
export class SubmitArticleQuizBodyDTO extends createZodDto(SubmitArticleQuizBodySchema) {}
export class SubmitArticleQuizResDTO extends createZodDto(SubmitArticleQuizResSchema) {}

export class GetArticleContentResDTO extends createZodDto(GetArticleContentResSchema) {}

export class ArticleProgressBodyDTO extends createZodDto(ArticleProgressBodySchema) {}
export class ArticleProgressResDTO extends createZodDto(ArticleProgressResSchema) {}

export class UpdateArticleBodyDTO extends createZodDto(UpdateArticleBodySchema) {}

export class CreateArticleBodyDTO extends createZodDto(CreateArticleBodySchema) {}
export class CreateArticleResDTO extends createZodDto(CreateArticleResSchema) {}

export class CreateQuizBodyDTO extends createZodDto(CreateQuizBodySchema) {}

export class UpdateQuizQuestionBodyDTO extends createZodDto(UpdateQuizQuestionSchema) {}
