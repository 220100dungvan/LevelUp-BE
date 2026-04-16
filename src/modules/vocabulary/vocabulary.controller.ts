import { UserRole } from '@/common/constants/auth.constant'
import type { RoleNameType } from '@/common/constants/role.constant'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  AddItemsToListBodyDTO,
  AddItemsToListResDTO,
  CreateVocabularyBodyDTO,
  CreateVocabularyListBodyDTO,
  CreateVocabularyListResDTO,
  CreateVocabularyResDTO,
  CreateTopicBodyDTO,
  DeleteVocabularyListResDTO,
  GetListDetailResDTO,
  GetListsQueryDTO,
  GetListsResDTO,
  GetTopicsResDTO,
  ReorderItemsBodyDTO,
  UpdateVocabularyListBodyDTO,
  UpdateTopicBodyDTO,
  VocabularyTopicDTO,
} from '@/modules/vocabulary/vocabulary.dto'
import { VocabularyService } from '@/modules/vocabulary/vocabulary.service'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('vocabularies')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // Lấy danh sách chủ đề từ vựng
  @Get('topic')
  @ZodResponse({ type: GetTopicsResDTO })
  getTopics() {
    return this.vocabularyService.getTopics()
  }

  // Lấy chi tiết một chủ đề
  @Get('topic/:id')
  @ZodResponse({ type: VocabularyTopicDTO })
  getTopic(@Param('id') topicId: string) {
    return this.vocabularyService.getTopic(topicId)
  }

  // Tạo mới chủ đề từ vựng [Teacher/Admin]
  @Post('topic')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: VocabularyTopicDTO })
  createTopic(@Body() body: CreateTopicBodyDTO) {
    return this.vocabularyService.createTopic(body)
  }

  // Cập nhật chủ đề từ vựng [Teacher/Admin]
  @Patch('topic/:id')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: VocabularyTopicDTO })
  updateTopic(@Param('id') topicId: string, @Body() body: UpdateTopicBodyDTO) {
    return this.vocabularyService.updateTopic(topicId, body)
  }

  // Xóa mềm chủ đề từ vựng [Teacher/Admin]
  @Delete('topic/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  deleteTopic(@Param('id') topicId: string) {
    return this.vocabularyService.deleteTopic(topicId)
  }

  // Lấy danh sách các list từ vựng
  @Get('list')
  @ZodResponse({ type: GetListsResDTO })
  getLists(@Query() query: GetListsQueryDTO) {
    return this.vocabularyService.getLists(query)
  }

  // Lấy chi tiết list, bao gồm danh sách từ vựng bên trong (kiểm tra quyền truy cập)
  @Get('list/:id')
  @ZodResponse({ type: GetListDetailResDTO })
  getListDetail(@Param('id') listId: string, @ActiveUser('userId') userId: string) {
    return this.vocabularyService.getListDetail({ listId, userId })
  }

  // Tạo mới list từ vựng [Teacher/Admin]
  @Post('list')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: CreateVocabularyListResDTO })
  createList(@Body() body: CreateVocabularyListBodyDTO, @ActiveUser('userId') userId: string) {
    return this.vocabularyService.createList(body, userId)
  }

  // Cập nhật thông tin list (chỉ owner hoặc admin)
  @Patch('list/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: CreateVocabularyListResDTO })
  updateList(
    @Param('id') id: string,
    @Body() body: UpdateVocabularyListBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: RoleNameType,
  ) {
    return this.vocabularyService.updateList(id, body, userId, role)
  }

  //xóa mềm
  @Delete('list/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: DeleteVocabularyListResDTO })
  deleteList(@Param('id') id: string, @ActiveUser('userId') userId: string, @ActiveUser('role') role: RoleNameType) {
    return this.vocabularyService.deleteList(id, userId, role)
  }

  // Thêm từ vựng vào list (từ đã có trong DB hoặc tạo mới)
  @Post('list/:id/items')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: AddItemsToListResDTO })
  addItemsToList(
    @Param('id') id: string,
    @Body() body: AddItemsToListBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: RoleNameType,
  ) {
    return this.vocabularyService.addItemsToList(id, body, userId, role)
  }

  // Xóa một từ khỏi list
  @Delete('list/:id/items/:vocabularyId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  removeItemFromList(
    @Param('id') id: string,
    @Param('vocabularyId') vocabularyId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: RoleNameType,
  ) {
    return this.vocabularyService.removeItemFromList(id, vocabularyId, userId, role)
  }

  // Sắp xếp lại thứ tự từ trong list
  @Patch('list/:id/items/reorder')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  reorderItems(
    @Param('id') id: string,
    @Body() body: ReorderItemsBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: RoleNameType,
  ) {
    return this.vocabularyService.reorderItems(id, body, userId, role)
  }

  // Tạo một từ vựng standalone [Teacher/Admin]
  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: CreateVocabularyResDTO })
  createVocabulary(@Body() body: CreateVocabularyBodyDTO, @ActiveUser('userId') userId: string) {
    return this.vocabularyService.createVocabulary(body, userId)
  }
}
