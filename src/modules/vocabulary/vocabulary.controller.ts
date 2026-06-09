import { UserRole } from '@/common/constants/auth.constant'
import type { RoleNameType } from '@/common/constants/role.constant'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { IsPublic } from '@/common/decorators/auth.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import { optionalImageFileValidationPipe } from '@/common/pipes/image-file-validation.pipe'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'
import {
  AddItemsToListResDTO,
  CreateVocabularyBodyDTO,
  CreateVocabularyListBodyDTO,
  CreateVocabularyListResDTO,
  CreateVocabularyResDTO,
  DeleteVocabularyListResDTO,
  GetListDetailResDTO,
  GetListsQueryDTO,
  GetListsResDTO,
  GetTopicsResDTO,
  ReorderItemsBodyDTO,
  UpdateVocabularyListBodyDTO,
  UpdateVocabularyTopicBodyDTO,
  VocabularyTopicDTO,
  SearchVocabularyResDTO,
  SearchVocabularyQueryDTO,
  AddNewVocabularyToListBodyDTO,
  AddItemsByIdsBodyDTO,
  CreateVocabularyTopicBodyDTO,
} from '@/modules/vocabulary/vocabulary.dto'
import { VocabularyService } from '@/modules/vocabulary/vocabulary.service'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ZodResponse } from 'nestjs-zod'

@Controller('vocabularies')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // Lấy danh sách chủ đề từ vựng
  @Get('topic')
  @IsPublic()
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

  // Tạo mới chủ đề từ vựng [Admin]
  @Post('topic')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ZodResponse({ type: VocabularyTopicDTO })
  createTopic(
    @Body() body: CreateVocabularyTopicBodyDTO,
    @UploadedFile(optionalImageFileValidationPipe) thumbnail: UploadedFileData,
  ) {
    return this.vocabularyService.createTopic(body, thumbnail)
  }

  // Cập nhật chủ đề từ vựng [Admin]
  @Patch('topic/:id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ZodResponse({ type: VocabularyTopicDTO })
  updateTopic(
    @Param('id') topicId: string,
    @Body() body: UpdateVocabularyTopicBodyDTO,
    @UploadedFile(optionalImageFileValidationPipe) thumbnail?: UploadedFileData,
  ) {
    return this.vocabularyService.updateTopic(topicId, body, thumbnail)
  }

  // Xóa mềm chủ đề từ vựng [Admin]
  @Delete('topic/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  deleteTopic(@Param('id') topicId: string) {
    return this.vocabularyService.deleteTopic(topicId)
  }

  // Lấy danh sách các list từ vựng
  @Get('list')
  @IsPublic()
  @ZodResponse({ type: GetListsResDTO })
  getLists(@Query() query: GetListsQueryDTO) {
    return this.vocabularyService.getLists(query)
  }

  // Lấy danh sách các list từ vựng (admin)
  @Get('admin/list')
  @Roles(UserRole.ADMIN)
  @ZodResponse({ type: GetListsResDTO })
  getListsForAdmin(@Query() query: GetListsQueryDTO) {
    return this.vocabularyService.getListsForAdmin(query)
  }

  // Lấy chi tiết list, bao gồm danh sách từ vựng bên trong (kiểm tra quyền truy cập)
  @Get('list/:id')
  @IsPublic()
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

  @Post('list/:id/items')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: AddItemsToListResDTO })
  addItemsByIds(
    @Param('id') id: string,
    @Body() body: AddItemsByIdsBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: RoleNameType,
  ) {
    return this.vocabularyService.addItemsByIds(id, body, userId, role)
  }

  @Post('list/:id/items/with-image')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @ZodResponse({ type: AddItemsToListResDTO })
  addNewVocabularyToList(
    @Param('id') id: string,
    @Body() body: AddNewVocabularyToListBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: RoleNameType,
    @UploadedFile(optionalImageFileValidationPipe) image: UploadedFileData,
  ) {
    return this.vocabularyService.addNewVocabularyToList(id, body, image, userId, role)
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

  // Tìm kiếm từ vựng theo từ khóa
  @Get('search')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: SearchVocabularyResDTO })
  searchVocabularies(@Query() query: SearchVocabularyQueryDTO) {
    return this.vocabularyService.searchVocabularies(query)
  }
}
