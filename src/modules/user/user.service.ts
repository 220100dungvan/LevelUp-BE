import { UserStatus } from '@/common/constants/auth.constant'
import { UserRepository } from '@/modules/user/user.repo'
import { GetUsersQueryType, UpdateUserBodyType } from '@/modules/user/user.schema'
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUsers(query: GetUsersQueryType) {
    const { data, total } = await this.userRepository.findMany(query)
    const { page, limit } = query

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findUniqueWithDetail(id)
    if (!user) {
      throw new NotFoundException([{ message: 'Error.UserNotFound', path: 'id' }])
    }

    const { classMemberships, ...rest } = user

    const classes = (classMemberships ?? []).map((membership) => ({
      id: membership.classRoom.id,
      name: membership.classRoom.name,
      description: membership.classRoom.description,
      imageUrl: membership.classRoom.imageUrl,
      inviteCode: membership.classRoom.inviteCode,
      role: membership.role,
      joinedAt: membership.joinedAt,
      teacher: membership.classRoom.teacher,
      totalMembers: membership.classRoom._count.members,
      createdAt: membership.classRoom.createdAt,
    }))

    return { ...rest, classes }
  }

  async updateUser(id: string, body: UpdateUserBodyType) {
    const user = await this.userRepository.findUnique({ id })
    if (!user) {
      throw new NotFoundException([{ message: 'Error.UserNotFound', path: 'id' }])
    }

    return this.userRepository.update({ id }, { ...body, updatedAt: new Date() })
  }

  // Admin: block user
  async blockUser(id: string) {
    const user = await this.userRepository.findUnique({ id })
    if (!user) {
      throw new NotFoundException([{ message: 'Error.UserNotFound', path: 'id' }])
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new UnprocessableEntityException([{ message: 'Error.UserAlreadyBlocked', path: 'id' }])
    }

    await this.userRepository.update({ id }, { status: UserStatus.BLOCKED, updatedAt: new Date() })
    return { message: 'Khóa tài khoản thành công' }
  }

  // Admin: unblock user
  async unblockUser(id: string) {
    const user = await this.userRepository.findUnique({ id })
    if (!user) {
      throw new NotFoundException([{ message: 'Error.UserNotFound', path: 'id' }])
    }
    if (user.status !== UserStatus.BLOCKED) {
      throw new UnprocessableEntityException([{ message: 'Error.UserNotBlocked', path: 'id' }])
    }

    await this.userRepository.update({ id }, { status: UserStatus.ACTIVE, updatedAt: new Date() })
    return { message: 'Mở khóa tài khoản thành công' }
  }
}
