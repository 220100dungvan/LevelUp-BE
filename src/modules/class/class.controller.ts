import { UserRole, type UserRoleType } from '@/common/constants/auth.constant'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import { IsPublic } from '@/common/decorators/auth.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  AddMembersBodyDTO,
  AddMembersResDTO,
  AssignVocabListBodyDTO,
  AssignVocabListResDTO,
  ClassDetailResDTO,
  ClassOverviewResDTO,
  CreateClassBodyDTO,
  CreateClassResDTO,
  GetClassMaterialsResDTO,
  GetClassMembersResDTO,
  GetClassStatisticsResDTO,
  GetClassVocabListsResDTO,
  GetMemberProgressResDTO,
  GetOverviewMyClassesResDTO,
  TransferMemberBodyDTO,
  UpdateClassBodyDTO,
  UpdateClassResDTO,
} from '@/modules/class/class.dto'
import { ClassService } from '@/modules/class/class.service'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get('me')
  @ZodResponse({ type: GetOverviewMyClassesResDTO })
  getOverviewMyClasses(@ActiveUser('userId') userId: string, @ActiveUser('role') role: UserRoleType) {
    return this.classService.getOverviewtMyClasses(userId, role)
  }

  @Get('join/:inviteCode')
  @IsPublic()
  @ZodResponse({ type: ClassOverviewResDTO })
  getClassOverview(@Param('inviteCode') inviteCode: string, @ActiveUser('userId') userId: string) {
    return this.classService.getClassOverviewByInviteCode(inviteCode, userId)
  }

  @Post('join/:inviteCode')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  joinClass(@Param('inviteCode') inviteCode: string, @ActiveUser('userId') userId: string) {
    return this.classService.joinClass(inviteCode, userId)
  }

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: CreateClassResDTO })
  createClass(@Body() body: CreateClassBodyDTO, @ActiveUser('userId') userId: string) {
    return this.classService.createClass(body, userId)
  }

  @Patch(':classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: UpdateClassResDTO })
  updateClass(
    @Param('classId') classId: string,
    @Body() body: UpdateClassBodyDTO,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.classService.updateClass(classId, body, userId, role)
  }

  @Delete(':classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  deleteClass(
    @Param('classId') classId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.classService.deleteClass(classId, userId, role)
  }

  @Get(':classId')
  @ZodResponse({ type: ClassDetailResDTO })
  getClassDetail(
    @Param('classId') classId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.classService.getClassDetail(classId, userId, role)
  }

  @Post(':classId/members')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: AddMembersResDTO })
  addMembers(@Param('classId') classId: string, @Body() body: AddMembersBodyDTO, @ActiveUser('userId') userId: string) {
    return this.classService.addMembersByEmail(classId, body, userId)
  }

  @Delete(':classId/members/:memberId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  removeMember(
    @Param('classId') classId: string,
    @Param('memberId') memberId: string,
    @ActiveUser('userId') userId: string,
  ) {
    return this.classService.removeMember(classId, memberId, userId)
  }

  @Post(':classId/members/:memberId/transfer')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  transferMember(
    @Param('classId') classId: string,
    @Param('memberId') memberId: string,
    @Body() body: TransferMemberBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.classService.transferMember(classId, memberId, body, userId)
  }

  @Post(':classId/vocab-lists')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: AssignVocabListResDTO })
  assignVocabLists(
    @Param('classId') classId: string,
    @Body() body: AssignVocabListBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.classService.assignVocabLists(classId, body, userId)
  }

  @Delete(':classId/vocab-lists/:listId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  removeVocabList(
    @Param('classId') classId: string,
    @Param('listId') listId: string,
    @ActiveUser('userId') userId: string,
  ) {
    return this.classService.removeVocabList(classId, listId, userId)
  }

  @Get(':classId/vocab-lists')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: GetClassVocabListsResDTO })
  getClassVocabLists(
    @Param('classId') classId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.classService.getClassVocabLists(classId, userId, role)
  }

  @Get(':classId/statistics')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: GetClassStatisticsResDTO })
  getClassStatistics(
    @Param('classId') classId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.classService.getClassStatistics(classId, userId, role)
  }

  @Get(':classId/members/:memberId/progress')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ZodResponse({ type: GetMemberProgressResDTO })
  getMemberProgress(
    @Param('classId') classId: string,
    @Param('memberId') memberId: string,
    @ActiveUser('userId') userId: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.classService.getMemberProgress(classId, memberId, userId, role)
  }

  @Get(':classId/members')
  @ZodResponse({ type: GetClassMembersResDTO })
  getClassMembers(@Param('classId') classId: string, @ActiveUser('userId') userId: string) {
    return this.classService.getClassMembers(classId, userId)
  }

  @Get(':classId/materials')
  @ZodResponse({ type: GetClassMaterialsResDTO })
  getClassMaterials(@Param('classId') classId: string, @ActiveUser('userId') userId: string) {
    return this.classService.getClassMaterials(classId, userId)
  }
}
