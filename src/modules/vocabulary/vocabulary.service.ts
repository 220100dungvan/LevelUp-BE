import { UserRole } from '@/common/constants/auth.constant'
import { isDataValidationPrismaError, isNotFoundPrismaError } from '@/common/utils/helpers'
import { VocabularyRepository } from '@/modules/vocabulary/vocabulary.repo'
import { UserStatRepository } from '@/common/repositories/user-stat.repo'
import {
  CreateVocabularyBodyType,
  CreateVocabularyListBodyType,
  GetLearningProgressOverviewQueryType,
  GetListsQueryType,
  ReorderItemsBodyType,
  SubmitLearningWordBodyType,
  UpdateVocabularyListBodyType,
  UpdateVocabularyTopicBodyType,
  SearchVocabularyQueryType,
  AddNewVocabularyToListBodyType,
  AddItemsByIdsBodyType,
  CreateVocabularyTopicBodyType,
  GetWordsAdminQueryType,
  UpdateVocabularyBodyType,
  CreateLearnerListBodyType,
  UpdateLearnerListBodyType,
} from '@/modules/vocabulary/vocabulary.schema'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { encryptData } from '@/common/utils/encryption'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'
import { CloudinaryService } from '@/common/services/cloudinary.service'
import envConfig from '@/common/utils/config'
import { TextToSpeechService } from '@/common/services/text-to-speech.service'
import { VocabularyIndexService } from '@/modules/vocabulary/vocabulary-index.service'

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name)

  constructor(
    private readonly vocabularyRepository: VocabularyRepository,
    private readonly userStatRepository: UserStatRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly textToSpeechService: TextToSpeechService,
    private readonly vocabularyIndexService: VocabularyIndexService,
  ) {}

  private async verifyAccess(
    list: { id: string; isPublic: boolean; createdBy: string },
    userId: string,
  ): Promise<void> {
    if (list.isPublic) return
    if (list.createdBy === userId) return

    const access = await this.vocabularyRepository.checkAccess(list.id, userId)
    if (!access) {
      throw new ForbiddenException('Error.NoAccessToVocabularyList')
    }
  }

  // Encryption helper extracted to common util

  private verifyOwnerOrAdmin(createdBy: string, userId: string, role: string): void {
    if (role === UserRole.ADMIN) return
    if (createdBy === userId) return
    throw new ForbiddenException('Error.ForbiddenAction')
  }

  /**
   * Sinh UK + US audio cho từ rồi upload lên Cloudinary.
   * Trả về { audioUrlUk, audioUrlUs }.
   * Nếu TTS thất bại, log warning và trả về undefined (không block việc tạo từ).
   */
  private async generateAndUploadVocabularyAudio(word: string): Promise<{ audioUrlUk?: string; audioUrlUs?: string }> {
    try {
      const { ukBuffer, usBuffer } = await this.textToSpeechService.generateVocabularyAudioBuffers(word)

      const slug = word
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const [audioUrlUk, audioUrlUs] = await Promise.all([
        this.cloudinaryService.uploadAudio(
          {
            buffer: ukBuffer,
            mimetype: 'audio/mpeg',
            originalname: `vocab_uk_${slug}.mp3`,
            size: ukBuffer.byteLength,
          },
          envConfig.CLOUDINARY_VOCABULARY_AUDIO_FOLDER,
        ),
        this.cloudinaryService.uploadAudio(
          {
            buffer: usBuffer,
            mimetype: 'audio/mpeg',
            originalname: `vocab_us_${slug}.mp3`,
            size: usBuffer.byteLength,
          },
          envConfig.CLOUDINARY_VOCABULARY_AUDIO_FOLDER,
        ),
      ])

      return { audioUrlUk, audioUrlUs }
    } catch (err) {
      this.logger.warn(`TTS generation failed for word "${word}": ${(err as Error).message}`)
      return {}
    }
  }

  private verifyOwner(createdBy: string, userId: string): void {
    if (createdBy !== userId) {
      throw new ForbiddenException('Error.ForbiddenAction')
    }
  }

  getTopics() {
    return this.vocabularyRepository.findAllTopics()
  }

  async getTopic(topicId: string) {
    const topic = await this.vocabularyRepository.findTopicById(topicId)
    if (!topic) {
      throw new NotFoundException('Error.VocabularyTopicNotFound')
    }
    return topic
  }

  async createTopic(body: CreateVocabularyTopicBodyType, thumbnail: UploadedFileData) {
    if (!thumbnail) {
      throw new UnprocessableEntityException([
        {
          path: 'thumbnail',
          message: 'Error.ThumbnailIsRequired',
        },
      ])
    }
    const thumbnailUrl = await this.cloudinaryService.uploadImage(
      thumbnail,
      envConfig.CLOUDINARY_VOCABULARY_TOPIC_FOLDER,
    )
    return this.vocabularyRepository.createTopic(body, thumbnailUrl)
  }

  async updateTopic(topicId: string, body: UpdateVocabularyTopicBodyType, thumbnail?: UploadedFileData) {
    const topic = await this.vocabularyRepository.findTopicById(topicId)
    if (!topic) {
      throw new NotFoundException('Error.VocabularyTopicNotFound')
    }

    const thumbnailUrl = thumbnail
      ? await this.cloudinaryService.uploadImage(thumbnail, envConfig.CLOUDINARY_VOCABULARY_TOPIC_FOLDER)
      : undefined

    return this.vocabularyRepository.updateTopic(topicId, body, thumbnailUrl)
  }

  async deleteTopic(topicId: string) {
    const topic = await this.vocabularyRepository.findTopicById(topicId)
    if (!topic) {
      throw new NotFoundException('Error.VocabularyTopicNotFound')
    }
    await this.vocabularyRepository.softDeleteTopic(topicId)
    return { message: 'Xóa chủ đề từ vựng thành công' }
  }

  getLists(query: GetListsQueryType) {
    return this.vocabularyRepository.findLists({
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    })
  }
  getListsForAdmin(query: GetListsQueryType) {
    return this.vocabularyRepository.findListsForAdmin({
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    })
  }

  async getListDetail({ listId, userId }: { listId: string; userId: string }) {
    const list = await this.vocabularyRepository.findListWithItems(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    // Kiểm tra quyền truy cập
    await this.verifyAccess(list, userId)

    // Lấy progress của user cho từng từ
    const items = await this.vocabularyRepository.findListItemsForUser(listId, userId)

    const vocabularies = items.map((item) => {
      const progress = item.vocabulary.userProgress?.[0] ?? null
      return {
        id: item.vocabulary.id,
        word: item.vocabulary.word,
        phoneticUk: item.vocabulary.phoneticUk,
        phoneticUs: item.vocabulary.phoneticUs,
        partOfSpeech: item.vocabulary.partOfSpeech,
        meaningVi: item.vocabulary.meaningVi,
        meaningEn: item.vocabulary.meaningEn,
        exampleEn: item.vocabulary.exampleEn,
        exampleVi: item.vocabulary.exampleVi,
        imageUrl: item.vocabulary.imageUrl,
        audioUrlUk: item.vocabulary.audioUrlUk,
        audioUrlUs: item.vocabulary.audioUrlUs,
        audioExampleUrl: item.vocabulary.audioExampleUrl,
        level: item.vocabulary.level,
        orderIndex: item.orderIndex,
        userProgress: progress
          ? {
              status: progress.status,
              correctCount: progress.correctCount,
              wrongCount: progress.wrongCount,
              lastReviewedAt: progress.lastReviewedAt,
              nextReviewAt: progress.nextReviewAt,
            }
          : null,
      }
    })

    // Encrypt danh sách từ
    const { encryptedData, iv } = encryptData(JSON.stringify(vocabularies))

    return {
      id: list.id,
      name: list.name,
      description: list.description,
      level: list.level,
      isPublic: list.isPublic,
      topic: list.topic,
      creator: list.creator,
      totalWords: list._count.items,
      encryptedData,
      iv,
    }
  }

  async createList(body: CreateVocabularyListBodyType, userId: string) {
    const list = await this.vocabularyRepository.createList({ ...body, createdBy: userId })
    return {
      ...list,
      totalWords: list._count.items,
    }
  }

  async updateList(listId: string, body: UpdateVocabularyListBodyType, userId: string, role: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    const updated = await this.vocabularyRepository.updateList(listId, body)
    return { ...updated, totalWords: updated._count.items }
  }

  async deleteList(listId: string, userId: string, role: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    await this.vocabularyRepository.softDeleteList(listId)
    return { message: 'Xóa danh sách từ vựng thành công' }
  }

  async addItemsByIds(listId: string, body: AddItemsByIdsBodyType, userId: string, role: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    const existing = await this.vocabularyRepository.findExistingListItems(listId, body.vocabularyIds)
    const existingIds = new Set(existing.map((e) => e.vocabularyId))
    const newIds = body.vocabularyIds.filter((id) => !existingIds.has(id))

    if (newIds.length === 0) {
      return { added: 0, skipped: body.vocabularyIds.length }
    }

    const maxIndex = await this.vocabularyRepository.getMaxOrderIndex(listId)
    const items = newIds.map((vocabularyId, i) => ({
      listId,
      vocabularyId,
      orderIndex: maxIndex + 1 + i,
    }))

    await this.vocabularyRepository.addItemsToList(items)
    return { added: newIds.length, skipped: body.vocabularyIds.length - newIds.length }
  }

  async addNewVocabularyToList({
    listId,
    body,
    image,
    userId,
    role,
  }: {
    listId: string
    body: AddNewVocabularyToListBodyType
    image?: UploadedFileData
    userId: string
    role: string
  }) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    // Upload ảnh nếu có
    let imageUrl: string | undefined
    if (image) {
      imageUrl = await this.cloudinaryService.uploadImage(image, envConfig.CLOUDINARY_VOCABULARY_IMAGE_FOLDER)
    }

    const { audioUrlUk, audioUrlUs } = await this.generateAndUploadVocabularyAudio(body.word)

    const vocabulary = await this.vocabularyRepository.createVocabulary({
      ...body,
      imageUrl,
      audioUrlUk,
      audioUrlUs,
      createdBy: userId,
    })

    // Sync to Elasticsearch (fire-and-forget)
    this.vocabularyIndexService.indexVocabulary({ ...vocabulary, deletedAt: null }).catch(() => {})

    const maxIndex = await this.vocabularyRepository.getMaxOrderIndex(listId)
    await this.vocabularyRepository.addItemsToList([{ listId, vocabularyId: vocabulary.id, orderIndex: maxIndex + 1 }])

    return { added: 1, skipped: 0 }
  }

  async removeItemFromList(listId: string, vocabularyId: string, userId: string, role: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    try {
      await this.vocabularyRepository.removeItemFromList(listId, vocabularyId)
    } catch {
      throw new NotFoundException('Error.VocabularyNotFoundInList')
    }

    return { message: 'Xóa từ vựng khỏi danh sách thành công' }
  }

  async reorderItems(listId: string, body: ReorderItemsBodyType, userId: string, role: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    await this.vocabularyRepository.reorderItems(listId, body.orderedVocabularyIds)
    return { message: 'Sắp xếp lại từ vựng thành công' }
  }

  async createVocabulary(body: CreateVocabularyBodyType, userId: string, image?: UploadedFileData) {
    let imageUrl: string | undefined
    if (image) {
      imageUrl = await this.cloudinaryService.uploadImage(image, envConfig.CLOUDINARY_VOCABULARY_IMAGE_FOLDER)
    }

    const { audioUrlUk, audioUrlUs } = await this.generateAndUploadVocabularyAudio(body.word)

    const vocabulary = await this.vocabularyRepository.createVocabulary({
      ...body,
      createdBy: userId,
      imageUrl,
      audioUrlUk,
      audioUrlUs,
    })

    // Sync to Elasticsearch (fire-and-forget)
    this.vocabularyIndexService.indexVocabulary({ ...vocabulary, deletedAt: null }).catch(() => {})

    return vocabulary
  }

  async submitLearningWord(body: SubmitLearningWordBodyType, userId: string) {
    const { listId, vocabularyId, status, isCorrect } = body

    // Validate list & vocab tồn tại
    const [list, vocab] = await Promise.all([
      this.vocabularyRepository.findListById(listId),
      this.vocabularyRepository.findVocabularyById(vocabularyId),
    ])
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')
    if (!vocab) throw new NotFoundException('Error.VocabularyNotFound')

    // Kiểm tra quyền truy cập list
    await this.verifyAccess(list, userId)

    // Lấy progress hiện tại để biết đây có phải từ mới không
    const existing = await this.vocabularyRepository.findUserProgress(userId, vocabularyId, listId)
    const isNewWord = !existing

    // Upsert progress
    const progress = await this.vocabularyRepository.upsertUserProgress({
      userId,
      vocabularyId,
      listId,
      status,
      isCorrect,
    })

    // Cập nhật các bảng thống kê song song
    await Promise.all([
      this.vocabularyRepository.updateLearningDaily(userId, listId, isCorrect, isNewWord),
      this.vocabularyRepository.updateListProgress(userId, listId),
      this.vocabularyRepository.updateUserStat(userId, isCorrect, isNewWord),
    ])

    // Cập nhật streak (idempotent)
    await this.userStatRepository.updateStreak(userId)

    return {
      status: progress.status,
      correctCount: progress.correctCount,
      wrongCount: progress.wrongCount,
      nextReviewAt: progress.nextReviewAt,
    }
  }

  async getLearningProgressOverview(userId: string, query: GetLearningProgressOverviewQueryType) {
    return this.vocabularyRepository.getLearningProgressOverview(userId, query)
  }

  async getLearningProgressByList(userId: string, listId: string, query: GetLearningProgressOverviewQueryType) {
    try {
      const list = await this.vocabularyRepository.findListById(listId)

      if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

      await this.verifyAccess(list, userId)

      return this.vocabularyRepository.getLearningProgressByList(userId, listId, query)
    } catch (error) {
      if (isDataValidationPrismaError(error)) {
        throw new BadRequestException('Error.InvalidListIdFormat')
      }

      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Error.VocabularyListNotFound')
      }

      throw error
    }
  }

  /**
   * Search vocabularies.
   * Strategy: try Elasticsearch first (fast, fuzzy, typo-tolerant).
   * Falls back to Prisma ILIKE query when ES is unavailable.
   */
  async searchVocabularies(query: SearchVocabularyQueryType) {
    const esResults = await this.vocabularyIndexService.search(query)

    if (esResults !== null && esResults.length > 0) {
      const data = esResults.map((doc) => ({
        id: doc.id,
        word: doc.word,
        phoneticUk: doc.phoneticUk,
        phoneticUs: doc.phoneticUs,
        partOfSpeech: doc.partOfSpeech,
        meaningVi: doc.meaningVi,
        meaningEn: doc.meaningEn,
        exampleEn: doc.exampleEn,
        exampleVi: doc.exampleVi,
        imageUrl: doc.imageUrl,
        audioUrlUk: doc.audioUrlUk,
        audioUrlUs: doc.audioUrlUs,
        audioExampleUrl: doc.audioExampleUrl,
        level: doc.level,
      }))
      return { data }
    }

    const data = await this.vocabularyRepository.searchVocabularies(query)
    return { data }
  }

  // GET /admin/words — danh sách words + stats
  async getWordsForAdmin(query: GetWordsAdminQueryType) {
    return this.vocabularyRepository.findWordsForAdmin({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      level: query.level,
      partOfSpeech: query.partOfSpeech,
    })
  }

  // PATCH /admin/words/:id — cập nhật thông tin word (text fields)
  async updateVocabulary(wordId: string, body: UpdateVocabularyBodyType) {
    const word = await this.vocabularyRepository.findVocabularyById(wordId)
    if (!word) throw new NotFoundException('Error.VocabularyNotFound')

    return this.vocabularyRepository.updateVocabulary(wordId, body)
  }

  // DELETE /admin/words/:id — soft delete word
  async deleteVocabulary(wordId: string) {
    const word = await this.vocabularyRepository.findVocabularyById(wordId)
    if (!word) throw new NotFoundException('Error.VocabularyNotFound')

    await this.vocabularyRepository.softDeleteVocabulary(wordId)

    // Soft delete in Elasticsearch (fire-and-forget)
    this.vocabularyIndexService.deleteVocabulary(wordId).catch(() => {})

    return { message: 'Xóa từ vựng thành công' }
  }

  async getMyLists(userId: string, query: GetListsQueryType) {
    return await this.vocabularyRepository.findListsByOwner(userId, {
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    })
  }

  async createMyList(body: CreateLearnerListBodyType, userId: string) {
    const list = await this.vocabularyRepository.createList({
      ...body,
      isPublic: false,
      createdBy: userId,
    })
    return { ...list, totalWords: list._count.items }
  }

  async updateMyList(listId: string, body: UpdateLearnerListBodyType, userId: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwner(list.createdBy, userId)

    const updated = await this.vocabularyRepository.updateList(listId, body)
    return { ...updated, totalWords: updated._count.items }
  }

  async deleteMyList(listId: string, userId: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwner(list.createdBy, userId)

    await this.vocabularyRepository.softDeleteList(listId)
    return { message: 'Xóa danh sách từ vựng thành công' }
  }

  async addItemsToMyList(listId: string, body: AddItemsByIdsBodyType, userId: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwner(list.createdBy, userId)

    const existing = await this.vocabularyRepository.findExistingListItems(listId, body.vocabularyIds)
    const existingIds = new Set(existing.map((e) => e.vocabularyId))
    const newIds = body.vocabularyIds.filter((id) => !existingIds.has(id))

    if (newIds.length === 0) {
      return { added: 0, skipped: body.vocabularyIds.length }
    }

    const maxIndex = await this.vocabularyRepository.getMaxOrderIndex(listId)
    const items = newIds.map((vocabularyId, i) => ({
      listId,
      vocabularyId,
      orderIndex: maxIndex + 1 + i,
    }))

    await this.vocabularyRepository.addItemsToList(items)
    return { added: newIds.length, skipped: body.vocabularyIds.length - newIds.length }
  }

  async addNewVocabularyToMyList({
    listId,
    body,
    image,
    userId,
  }: {
    listId: string
    body: AddNewVocabularyToListBodyType
    image?: UploadedFileData
    userId: string
  }) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwner(list.createdBy, userId)

    let imageUrl: string | undefined
    if (image) {
      imageUrl = await this.cloudinaryService.uploadImage(image, envConfig.CLOUDINARY_VOCABULARY_IMAGE_FOLDER)
    }

    const { audioUrlUk, audioUrlUs } = await this.generateAndUploadVocabularyAudio(body.word)

    const vocabulary = await this.vocabularyRepository.createVocabulary({
      ...body,
      imageUrl,
      audioUrlUk,
      audioUrlUs,
      createdBy: userId,
    })

    // Sync to Elasticsearch (fire-and-forget)
    this.vocabularyIndexService.indexVocabulary({ ...vocabulary, deletedAt: null }).catch(() => {})

    const maxIndex = await this.vocabularyRepository.getMaxOrderIndex(listId)
    await this.vocabularyRepository.addItemsToList([{ listId, vocabularyId: vocabulary.id, orderIndex: maxIndex + 1 }])

    return { added: 1, skipped: 0 }
  }

  async removeItemFromMyList(listId: string, vocabularyId: string, userId: string) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwner(list.createdBy, userId)

    try {
      await this.vocabularyRepository.removeItemFromList(listId, vocabularyId)
    } catch {
      throw new NotFoundException('Error.VocabularyNotFoundInList')
    }

    return { message: 'Xóa từ vựng khỏi danh sách thành công' }
  }
}
