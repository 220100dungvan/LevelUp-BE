import { ArticleRepository } from '@/modules/article/article.repo'
import {
  ArticleProgressBodyType,
  CreateArticleBodyType,
  CreateQuizBodyType,
  GetArticlesQueryType,
  UpdateArticleBodyType,
  UpdateQuizQuestionType,
} from '@/modules/article/article.schema'
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class ArticleService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async getTopics() {
    const topics = await this.articleRepository.findAllTopics()
    return { data: topics }
  }

  async getArticles(query: GetArticlesQueryType) {
    const { data, total } = await this.articleRepository.findArticles({
      topicIds: query.topicIds,
      level: query.level,
      status: query.status ?? 'PUBLISHED',
      search: query.search,
      page: query.page,
      limit: query.limit,
    })

    return {
      data: data.map((a) => ({
        id: a.id,
        level: a.level,
        title: a.title,
        thumbnailUrl: a.thumbnailUrl,
        sourceUrl: a.sourceUrl,
        status: a.status,
        audioUrl: a.audioUrl,
        voiceType: a.voiceType,
        readingTimeMin: a.readingTimeMin,
        createdAt: a.createdAt,
        topics: a.topicMappings.map((m) => m.articleTopic),
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    }
  }

  async getArticleDetail(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    const [vocabularies, quizQuestions] = await Promise.all([
      this.articleRepository.findVocabulariesByArticleId(articleId),
      this.articleRepository.findQuizByArticleId(articleId),
    ])

    return {
      article: {
        ...article,
        topics: article.topicMappings.map((m) => m.articleTopic),
      },
      vocabularies,
      quizQuestions,
    }
  }

  async getArticleVocabularies(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    const vocabularies = await this.articleRepository.findVocabulariesByArticleId(articleId)
    return { data: vocabularies }
  }

  async getArticleQuiz(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    const quizQuestions = await this.articleRepository.findQuizByArticleId(articleId)
    return { data: quizQuestions }
  }

  async getArticleContent(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    return article
  }

  async updateProgress(userId: string, articleId: string, body: ArticleProgressBodyType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    // Auto-complete nếu scroll đến >= 95%
    const completed = body.completed ?? body.progressPct >= 95

    const progress = await this.articleRepository.upsertProgress({
      userId,
      articleId,
      progressPct: body.progressPct,
      completed,
    })

    return {
      message: 'Cập nhật tiến độ thành công',
      progressPct: progress.progressPct,
      completed: progress.completed,
    }
  }

  async adminUpdateArticle(articleId: string, body: UpdateArticleBodyType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])

    const { topicIds, ...rest } = body
    const updated = await this.articleRepository.updateArticle(
      articleId,
      {
        ...(rest.level && { level: rest.level }),
        ...(rest.title && { title: rest.title }),
        ...(rest.content && { content: rest.content }),
        ...(rest.contentVi !== undefined && { contentVi: rest.contentVi }),
        ...(rest.thumbnailUrl !== undefined && { thumbnailUrl: rest.thumbnailUrl }),
        ...(rest.sourceUrl !== undefined && { sourceUrl: rest.sourceUrl }),
        ...(rest.audioUrl !== undefined && { audioUrl: rest.audioUrl }),
        ...(rest.voiceType !== undefined && { voiceType: rest.voiceType }),
        ...(rest.readingTimeMin !== undefined && { readingTimeMin: rest.readingTimeMin }),
        ...(rest.status && { status: rest.status }),
      },
      topicIds,
    )

    return { message: 'Cập nhật bài báo thành công', article: updated }
  }

  async adminDeleteArticle(articleId: string) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    await this.articleRepository.softDeleteArticle(articleId)
    return { message: 'Xóa bài báo thành công' }
  }

  async createArticle(body: CreateArticleBodyType, createdBy: string) {
    const articleId = await this.articleRepository.createArticle({ body, createdBy })
    return { articleId, message: 'Tạo bài báo thành công' }
  }

  async createQuiz(articleId: string, body: CreateQuizBodyType) {
    const article = await this.articleRepository.findArticleById(articleId)
    if (!article) throw new NotFoundException([{ message: 'Error.ArticleNotFound' }])
    await this.articleRepository.createQuizQuestions(articleId, body.questions)
    return { message: `Tạo thành công ${body.questions.length} câu hỏi` }
  }

  async updateQuizQuestion(questionId: string, body: UpdateQuizQuestionType) {
    const question = await this.articleRepository.findQuizQuestionById(questionId)
    if (!question) throw new NotFoundException([{ message: 'Error.QuizQuestionNotFound' }])
    const updated = await this.articleRepository.updateQuizQuestion(questionId, body as any)
    return { message: 'Cập nhật câu hỏi thành công', question: updated }
  }

  async deleteQuizQuestion(questionId: string) {
    const question = await this.articleRepository.findQuizQuestionById(questionId)
    if (!question) throw new NotFoundException([{ message: 'Error.QuizQuestionNotFound' }])
    await this.articleRepository.deleteQuizQuestion(questionId)
    return { message: 'Xóa câu hỏi thành công' }
  }
}
