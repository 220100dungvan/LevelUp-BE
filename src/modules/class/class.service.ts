import { UserRole, UserRoleType } from '@/common/constants/auth.constant'
import { RoleNameType } from '@/common/constants/role.constant'
import { ClassRepository } from '@/modules/class/class.repository'
import {
  AddMembersBodyType,
  AssignVocabListBodyType,
  CreateClassBodyType,
  TransferMemberBodyType,
  UpdateClassBodyType,
} from '@/modules/class/class.schema'
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { randomBytes } from 'crypto'

@Injectable()
export class ClassService {
  constructor(private readonly classRepository: ClassRepository) {}

  async getMyClasses(userId: string, role: UserRoleType) {
    if (role === UserRole.TEACHER || role === UserRole.ADMIN) {
      const classes = await this.classRepository.findClassesByTeacher(userId)
      return classes.map((cls) => {
        return {
          id: cls.id,
          name: cls.name,
          description: cls.description,
          inviteCode: cls.inviteCode,
          teacherId: cls.teacherId,
          teacher: cls.teacher,
          totalMembers: cls._count?.members ?? 0,
          createdAt: cls.createdAt,
        }
      })
    }

    const memberships = await this.classRepository.findClassesByLearner(userId)

    if (memberships.length === 0) return []

    return memberships.map(({ classRoom: cls }) => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      teacher: cls.teacher,
      totalMembers: cls._count?.members ?? 0,
      createdAt: cls.createdAt,
    }))
  }

  async getClassOverviewByInviteCode(inviteCode: string, userId?: string) {
    const cls = await this.classRepository.findClassByInviteCode(inviteCode)
    if (!cls) throw new NotFoundException('Error.ClassNotFound')

    const isAlreadyMember = userId ? !!(await this.classRepository.findMember(cls.id, userId)) : false

    return {
      id: cls.id,
      name: cls.name,
      description: cls.description ?? null,
      totalMembers: cls._count.members,
      teacher: cls.teacher,
      isAlreadyMember,
    }
  }

  async joinClass(inviteCode: string, userId: string) {
    const cls = await this.classRepository.findClassByInviteCode(inviteCode)
    if (!cls) throw new NotFoundException('Error.ClassNotFound')

    const existing = await this.classRepository.findMember(cls.id, userId)
    if (existing) throw new ConflictException('Error.AlreadyMemberOfClass')

    await this.classRepository.createMember(cls.id, userId)

    // Grant access to private lists in this class
    await this.classRepository.grantAllClassListsToMember(cls.id, userId, cls.teacherId)

    return { message: 'Tham gia lớp học thành công', classId: cls.id }
  }

  async createClass(body: CreateClassBodyType, teacherId: string) {
    const inviteCode = this.generateInviteCode()
    const cls = await this.classRepository.createClass({ ...body, teacherId, inviteCode })
    return {
      id: cls.id,
      name: cls.name,
      description: cls.description,
      inviteCode: cls.inviteCode,
      teacherId: cls.teacherId,
      createdAt: cls.createdAt,
    }
  }

  async updateClass(classId: string, body: UpdateClassBodyType, userId: string, role: RoleNameType) {
    await this.verifyTeacherOrAdminOwnsClass(classId, userId, role)
    const updatedClass = await this.classRepository.updateClass(classId, body)
    return {
      id: updatedClass.id,
      name: updatedClass.name,
      description: updatedClass.description,
      inviteCode: updatedClass.inviteCode,
      teacherId: updatedClass.teacherId,
      createdAt: updatedClass.createdAt,
    }
  }

  async deleteClass(classId: string, userId: string, role: RoleNameType) {
    await this.verifyTeacherOrAdminOwnsClass(classId, userId, role)
    await this.classRepository.softDeleteClass(classId)
    return { message: 'Xóa lớp học thành công' }
  }

  async getClassDetail(classId: string, userId: string, role: RoleNameType) {
    const cls = await this.classRepository.findClassDetail(classId)
    if (!cls) throw new NotFoundException('Error.ClassNotFound')

    if (role === UserRole.LEARNER) {
      const isMember = cls.members.some((m) => m.userId === userId)
      if (!isMember) throw new ForbiddenException('Error.NotAMember')
    } else if (role === UserRole.TEACHER && cls.teacherId !== userId) {
      throw new ForbiddenException('Error.ForbiddenAction')
    }

    return {
      id: cls.id,
      name: cls.name,
      description: cls.description,
      inviteCode: cls.inviteCode,
      teacherId: cls.teacherId,
      teacher: cls.teacher,
      totalMembers: cls._count?.members ?? 0,
      createdAt: cls.createdAt,
      members: cls.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      vocabLists: cls.vocabLists.map((a) => {
        return {
          id: a.list.id,
          name: a.list.name,
          description: a.list.description,
          level: a.list.level,
          isPublic: a.list.isPublic,
          totalWords: a.list._count.items,
          topic: a.list.topic,
          creator: a.list.creator,
          assignedAt: a.list.createdAt,
        }
      }),
    }
  }

  async regenerateInviteCode(classId: string, userId: string) {
    await this.verifyTeacherOwnsClass(classId, userId)
    const newCode = this.generateInviteCode()
    const updated = await this.classRepository.updateClass(classId, { inviteCode: newCode })
    return { inviteCode: updated.inviteCode }
  }

  async addMembersByEmail(classId: string, body: AddMembersBodyType, teacherId: string) {
    const foundUsers = await this.classRepository.findUsersByEmails(body.emails)
    const foundEmails = new Set(foundUsers.map((u) => u.email))
    const notFound = body.emails.filter((e) => !foundEmails.has(e))

    if (foundUsers.length === 0) {
      return { added: 0, skipped: 0, notFound }
    }

    const existingMembers = await Promise.all(foundUsers.map((u) => this.classRepository.findMember(classId, u.id)))

    const newUsers = foundUsers.filter((_, i) => !existingMembers[i])
    const skipped = foundUsers.length - newUsers.length

    if (newUsers.length > 0) {
      await this.classRepository.bulkCreateMembers(
        newUsers.map((u) => ({ classId, userId: u.id, role: body.role ?? 'STUDENT' })),
      )

      // Grant access to all private lists already in this class
      await Promise.all(newUsers.map((u) => this.classRepository.grantAllClassListsToMember(classId, u.id, teacherId)))
    }

    return { added: newUsers.length, skipped, notFound }
  }

  async removeMember(classId: string, memberId: string, teacherId: string) {
    await this.verifyTeacherOwnsClass(classId, teacherId)

    const member = await this.classRepository.findMember(classId, memberId)
    if (!member) throw new NotFoundException('Error.MemberNotFound')

    await this.classRepository.removeMember(classId, memberId)
    return { message: 'Xóa học viên khỏi lớp thành công' }
  }

  async transferMember(classId: string, memberId: string, body: TransferMemberBodyType, teacherId: string) {
    await this.verifyTeacherOwnsClass(classId, teacherId)
    await this.verifyTeacherOwnsClass(body.targetClassId, teacherId)

    const member = await this.classRepository.findMember(classId, memberId)
    if (!member) throw new NotFoundException('Error.MemberNotFound')

    const alreadyInTarget = await this.classRepository.findMember(body.targetClassId, memberId)
    if (alreadyInTarget) throw new ConflictException('Error.AlreadyMemberOfTargetClass')

    await this.classRepository.transferMember(classId, body.targetClassId, memberId)

    // Grant access to private lists in the target class
    await this.classRepository.grantAllClassListsToMember(body.targetClassId, memberId, teacherId)

    return { message: 'Chuyển học viên thành công' }
  }

  async assignVocabLists(classId: string, body: AssignVocabListBodyType, teacherId: string) {
    await this.verifyTeacherOwnsClass(classId, teacherId)

    const alreadyAssigned = await this.classRepository.findAssignedListIds(classId, body.listIds)
    const assignedIds = new Set(alreadyAssigned.map((a) => a.listId))
    const newIds = body.listIds.filter((id) => !assignedIds.has(id))

    if (newIds.length > 0) {
      await this.classRepository.assignVocabLists(classId, newIds)

      // Grant access to members for newly assigned lists
      await Promise.all(
        newIds.map((listId) => this.classRepository.grantListAccessToMembers(classId, listId, teacherId)),
      )
    }

    return {
      assigned: newIds.length,
      skipped: body.listIds.length - newIds.length,
    }
  }

  async removeVocabList(classId: string, listId: string, teacherId: string) {
    await this.verifyTeacherOwnsClass(classId, teacherId)

    const assignment = await this.classRepository.findAssignedList(classId, listId)
    if (!assignment) throw new NotFoundException('Error.ListNotAssignedToClass')

    await this.classRepository.removeVocabList(classId, listId)
    return { message: 'Xóa bộ từ vựng khỏi lớp thành công' }
  }

  async getClassVocabLists(classId: string, userId: string, role: RoleNameType) {
    await this.verifyTeacherOrAdminOwnsClass(classId, userId, role)
    const assignments = await this.classRepository.findClassVocabLists(classId)
    return {
      data: assignments.map((a) => {
        return {
          id: a.list.id,
          name: a.list.name,
          description: a.list.description,
          level: a.list.level,
          isPublic: a.list.isPublic,
          totalWords: a.list._count.items,
          topic: a.list.topic,
          creator: a.list.creator,
          assignedAt: a.list.createdAt,
        }
      }),
    }
  }

  async getClassStatistics(classId: string, userId: string, role: RoleNameType) {
    await this.verifyTeacherOrAdminOwnsClass(classId, userId, role)

    const cls = await this.classRepository.findClassById(classId)
    const { memberProgress, assignments } = await this.classRepository.getClassStatistics(classId)

    return {
      class: {
        id: classId,
        name: cls!.name,
        totalMembers: memberProgress.length,
        totalListsAssigned: assignments.length,
      },
      members: memberProgress.map(({ member, listsCompleted, overallProgressPct }) => ({
        user: member.user,
        role: member.role,
        totalListsAssigned: assignments.length,
        listsCompleted,
        overallProgressPct: Math.round(overallProgressPct * 10) / 10,
        totalWordsLearned: member.user.userStat?.totalWordsLearned ?? 0,
        learningStreak: member.user.userStat?.learningStreak ?? 0,
        lastLearnDate: member.user.userStat?.lastLearnDate ?? null,
      })),
    }
  }

  async getMemberProgress(classId: string, memberId: string, teacherId: string, role: RoleNameType) {
    await this.verifyTeacherOrAdminOwnsClass(classId, teacherId, role)

    const member = await this.classRepository.findMember(classId, memberId)
    if (!member) throw new NotFoundException('Error.MemberNotFound')

    const { assignments, listProgresses, wordProgresses } = await this.classRepository.getMemberProgress(
      classId,
      memberId,
    )

    const progressByList = new Map(listProgresses.map((p) => [p.listId, p]))
    const wordsByList = new Map<string, typeof wordProgresses>()
    for (const wp of wordProgresses) {
      if (!wordsByList.has(wp.listId)) wordsByList.set(wp.listId, [])
      wordsByList.get(wp.listId)!.push(wp)
    }

    const members = await this.classRepository.getClassMembers(classId)
    const memberUser = members.find((m) => m.userId === memberId)

    return {
      user: memberUser?.user,
      lists: assignments.map((a) => {
        const listProgress = progressByList.get(a.listId)
        const words = wordsByList.get(a.listId) ?? []

        return {
          listId: a.listId,
          listName: a.list.name,
          totalWords: a.list._count.items,
          learnedWords: words.length,
          progressPct: listProgress?.progressPct ?? 0,
          completed: listProgress?.completed ?? false,
          lastLearnedAt: listProgress?.lastLearnedAt ?? null,
          wordDetails: words.map((wp) => ({
            vocabularyId: wp.vocabularyId,
            word: wp.vocabulary?.word ?? '',
            status: wp.status,
            correctCount: wp.correctCount,
            wrongCount: wp.wrongCount,
            lastReviewedAt: wp.lastReviewedAt,
          })),
        }
      }),
    }
  }

  async getClassMembers(classId: string, userId: string) {
    await this.verifyIsMember(classId, userId)

    const assignments = await this.classRepository.findClassVocabLists(classId)
    const listIds = assignments.map((a) => a.listId)
    const { members, progresses } = await this.classRepository.getClassMembersWithProgress(classId, listIds)

    const progressByUser = new Map<string, number[]>()
    for (const p of progresses) {
      if (!progressByUser.has(p.userId)) progressByUser.set(p.userId, [])
      progressByUser.get(p.userId)!.push(p.progressPct)
    }

    return {
      data: members.map((m) => {
        const pcts = progressByUser.get(m.userId) ?? []
        const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null
        return {
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt,
          user: m.user,
          progressPct: avg !== null ? Math.round(avg * 10) / 10 : null,
        }
      }),
    }
  }

  async getClassMaterials(classId: string, userId: string) {
    await this.verifyIsMember(classId, userId)

    const { assignments, userProgresses } = await this.classRepository.getClassMaterialsForLearner(classId, userId)

    const progressByList = new Map(userProgresses.map((p) => [p.listId, p]))

    return {
      data: assignments.map((a) => {
        const progress = progressByList.get(a.listId) ?? null
        return {
          id: a.list.id,
          name: a.list.name,
          description: a.list.description,
          level: a.list.level,
          isPublic: a.list.isPublic,
          totalWords: a.list._count.items,
          topic: a.list.topic,
          creator: a.list.creator,
          assignedAt: a.list.createdAt,
          userProgress: progress
            ? {
                progressPct: progress.progressPct,
                completed: progress.completed,
                lastLearnedAt: progress.lastLearnedAt,
              }
            : null,
        }
      }),
    }
  }

  private async verifyIsMember(classId: string, userId: string) {
    const member = await this.classRepository.findMember(classId, userId)
    if (!member) throw new ForbiddenException('Error.NotAMember')
    return member
  }

  private async verifyTeacherOwnsClass(classId: string, userId: string) {
    const cls = await this.classRepository.findClassById(classId)
    if (!cls) throw new NotFoundException('Error.ClassNotFound')
    if (cls.teacherId !== userId) throw new ForbiddenException('Error.ForbiddenAction')
    return cls
  }

  private async verifyTeacherOrAdminOwnsClass(classId: string, userId: string, role: RoleNameType) {
    const cls = await this.classRepository.findClassById(classId)
    if (!cls) throw new NotFoundException('Error.ClassNotFound')
    if (role !== UserRole.ADMIN && cls.teacherId !== userId) {
      throw new ForbiddenException('Error.ForbiddenAction')
    }
    return cls
  }

  private generateInviteCode(): string {
    //"A3F9-B2C7"
    return randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .replace(/(.{4})/, '$1-')
  }
}
