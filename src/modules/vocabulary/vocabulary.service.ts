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
  CreateTopicBodyType,
  UpdateTopicBodyType,
  SearchVocabularyQueryType,
  AddNewVocabularyToListBodyType,
  AddItemsByIdsBodyType,
} from '@/modules/vocabulary/vocabulary.schema'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { encryptData } from '@/common/utils/encryption'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'
import { CloudinaryService } from '@/common/services/cloudinary.service'
import envConfig from '@/common/utils/config'

@Injectable()
export class VocabularyService {
  constructor(
    private readonly vocabularyRepository: VocabularyRepository,
    private readonly userStatRepository: UserStatRepository,
    private readonly cloudinaryService: CloudinaryService,
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

  async createTopic(body: CreateTopicBodyType) {
    return this.vocabularyRepository.createTopic(body)
  }

  async updateTopic(topicId: string, body: UpdateTopicBodyType) {
    const topic = await this.vocabularyRepository.findTopicById(topicId)
    if (!topic) {
      throw new NotFoundException('Error.VocabularyTopicNotFound')
    }
    return this.vocabularyRepository.updateTopic(topicId, body)
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

  async addNewVocabularyToList(
    listId: string,
    body: AddNewVocabularyToListBodyType,
    image: UploadedFileData,
    userId: string,
    role: string,
  ) {
    const list = await this.vocabularyRepository.findListById(listId)
    if (!list) throw new NotFoundException('Error.VocabularyListNotFound')

    this.verifyOwnerOrAdmin(list.createdBy, userId, role)

    if (!image) {
      throw new UnprocessableEntityException([
        {
          path: 'image',
          message: 'Error.ImageIsRequired',
        },
      ])
    }
    // Upload ảnh nếu có
    let imageUrl: string | undefined
    if (image) {
      imageUrl = await this.cloudinaryService.uploadImage(image, envConfig.CLOUDINARY_VOCABULARY_FOLDER)
    }

    const vocabulary = await this.vocabularyRepository.createVocabulary({
      ...body,
      imageUrl,
      createdBy: userId,
    })

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

  async createVocabulary(body: CreateVocabularyBodyType, userId: string) {
    return this.vocabularyRepository.createVocabulary({ ...body, createdBy: userId })
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

  async searchVocabularies(query: SearchVocabularyQueryType) {
    const data = await this.vocabularyRepository.searchVocabularies(query)
    return { data }
  }
}
