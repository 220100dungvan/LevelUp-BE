import {
  ArticleProgressBodySchema,
  ArticleProgressResSchema,
  CreateArticleBodySchema,
  CreateArticleResSchema,
  CreateArticleVocabulariesBodySchema,
  CreateQuizBodySchema,
  GetAllArticleQuizAttemptsResSchema,
  GetArticleQuizAttemptResSchema,
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
  CreateArticleTopicBodySchema,
  ArticleTopicSchema,
  UpdateArticleTopicBodySchema,
} from '@/modules/article/article.schema'
import { createZodDto } from 'nestjs-zod'

export class GetArticleTopicsResDTO extends createZodDto(GetArticleTopicsResSchema) {}

export class CreateArticleTopicBodyDTO extends createZodDto(CreateArticleTopicBodySchema) {}
export class UpdateArticleTopicBodyDTO extends createZodDto(UpdateArticleTopicBodySchema) {}

export class ArticleTopicDTO extends createZodDto(ArticleTopicSchema) {}

export class GetArticlesResDTO extends createZodDto(GetArticlesResSchema) {}
export class GetArticlesQueryDTO extends createZodDto(GetArticlesQuerySchema) {}

export class GetArticleVocabulariesResDTO extends createZodDto(GetArticleVocabulariesResSchema) {}
export class GetArticleQuizResDTO extends createZodDto(GetArticleQuizResSchema) {}
export class GetArticleQuizAttemptResDTO extends createZodDto(GetArticleQuizAttemptResSchema) {}
export class GetAllArticleQuizAttemptsResDTO extends createZodDto(GetAllArticleQuizAttemptsResSchema) {}

export class StartArticleQuizResDTO extends createZodDto(StartArticleQuizResSchema) {}
export class SubmitArticleQuizBodyDTO extends createZodDto(SubmitArticleQuizBodySchema) {}
export class SubmitArticleQuizResDTO extends createZodDto(SubmitArticleQuizResSchema) {}

export class GetArticleContentResDTO extends createZodDto(GetArticleContentResSchema) {}

export class ArticleProgressBodyDTO extends createZodDto(ArticleProgressBodySchema) {}
export class ArticleProgressResDTO extends createZodDto(ArticleProgressResSchema) {}

export class UpdateArticleBodyDTO extends createZodDto(UpdateArticleBodySchema) {}

export class CreateArticleBodyDTO extends createZodDto(CreateArticleBodySchema) {}
export class CreateArticleResDTO extends createZodDto(CreateArticleResSchema) {}

export class CreateArticleVocabulariesBodyDTO extends createZodDto(CreateArticleVocabulariesBodySchema) {}

export class CreateQuizBodyDTO extends createZodDto(CreateQuizBodySchema) {}

export class UpdateQuizQuestionBodyDTO extends createZodDto(UpdateQuizQuestionSchema) {}
