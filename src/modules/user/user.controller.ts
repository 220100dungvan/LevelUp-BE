import { UserRole } from '@/common/constants/auth.constant'
import { Roles } from '@/common/decorators/roles.decorator'
import { MessageResDTO } from '@/common/dtos/response.dto'
import {
  GetUserResDTO,
  GetUsersQueryDTO,
  GetUsersResDTO,
  UpdateUserBodyDTO,
  UpdateUserResDTO,
} from '@/modules/user/user.dto'
import { UserService } from '@/modules/user/user.service'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'

@Controller('users')
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users?page=1&limit=10&search=...&role=LEARNER&status=ACTIVE
  @Get()
  @ZodResponse({ type: GetUsersResDTO })
  getUsers(@Query() query: GetUsersQueryDTO) {
    return this.userService.getUsers(query)
  }

  // GET /users/:id
  @Get(':id')
  @ZodResponse({ type: GetUserResDTO })
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserById(id)
  }

  // PATCH /users/:id  — update role, status, fullName, phoneNumber
  @Patch(':id')
  @ZodResponse({ type: UpdateUserResDTO })
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateUserBodyDTO) {
    return this.userService.updateUser(id, body)
  }

  // PATCH /users/:id/block
  @Patch(':id/block')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  blockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.blockUser(id)
  }

  // PATCH /users/:id/unblock
  @Patch(':id/unblock')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: MessageResDTO })
  unblockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.unblockUser(id)
  }
}
