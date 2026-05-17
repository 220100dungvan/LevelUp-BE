import { PrismaService } from '@/common/services/prisma.service'
import { Prisma } from '@/generated/prisma/client'
import { CreateClassBodyType, UpdateClassBodyType } from '@/modules/class/class.schema'
import { Injectable } from '@nestjs/common'

const USER_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  email: true,
} satisfies Prisma.UserSelect

const LIST_INCLUDE = {
  topic: { select: { id: true, name: true, thumbnailUrl: true } },
  creator: { select: USER_SELECT },
  _count: { select: { items: true } },
} satisfies Prisma.VocabularyListInclude

@Injectable()
export class ClassRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findClassesByTeacher(teacherId: string) {
    return this.prismaService.class.findMany({
      where: { teacherId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: USER_SELECT },
        _count: { select: { members: true } },
      },
    })
  }

  async findClassesByLearner(userId: string) {
    const memberships = await this.prismaService.classMember.findMany({
      where: {
        userId,
        classRoom: { deletedAt: null },
      },
      include: {
        classRoom: {
          include: {
            teacher: { select: USER_SELECT },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })
    return memberships
  }

  async findClassByInviteCode(inviteCode: string) {
    return this.prismaService.class.findFirst({
      where: { inviteCode, deletedAt: null },
      include: {
        teacher: { select: USER_SELECT },
        _count: { select: { members: true } },
      },
    })
  }

  async findMember(classId: string, userId: string) {
    return this.prismaService.classMember.findUnique({
      where: { classId_userId: { classId, userId } },
    })
  }

  async createMember(classId: string, userId: string, role: 'STUDENT' | 'ASSISTANT' = 'STUDENT') {
    return this.prismaService.classMember.create({
      data: { classId, userId, role },
    })
  }

  async grantAllClassListsToMember(classId: string, userId: string, grantedBy: string) {
    const assignments = await this.prismaService.classVocabularyList.findMany({
      where: { classId },
      include: { list: { select: { id: true, isPublic: true } } },
    })

    const privateLists = assignments.filter((a) => !a.list.isPublic)
    if (privateLists.length === 0) return

    return this.prismaService.vocabularyListAccess.createMany({
      data: privateLists.map((a) => ({
        listId: a.listId,
        userId,
        classId,
        grantedBy,
      })),
      skipDuplicates: true,
    })
  }

  async createClass(payload: CreateClassBodyType & { teacherId: string; inviteCode: string }) {
    return this.prismaService.class.create({
      data: {
        name: payload.name,
        description: payload.description,
        teacherId: payload.teacherId,
        inviteCode: payload.inviteCode,
      },
      include: {
        teacher: { select: USER_SELECT },
        _count: { select: { members: true } },
      },
    })
  }

  async findClassById(classId: string) {
    return this.prismaService.class.findUnique({
      where: { id: classId, deletedAt: null },
      include: {
        teacher: { select: USER_SELECT },
        _count: { select: { members: true } },
      },
    })
  }

  async updateClass(classId: string, data: UpdateClassBodyType) {
    return this.prismaService.class.update({
      where: { id: classId },
      data,
      include: {
        teacher: { select: USER_SELECT },
        _count: { select: { members: true } },
      },
    })
  }

  async softDeleteClass(classId: string) {
    return this.prismaService.class.update({
      where: { id: classId },
      data: { deletedAt: new Date() },
    })
  }

  async findClassDetail(classId: string) {
    return this.prismaService.class.findUnique({
      where: { id: classId, deletedAt: null },
      include: {
        teacher: { select: USER_SELECT },
        _count: { select: { members: true } },
        members: {
          orderBy: { joinedAt: 'asc' },
          include: { user: { select: USER_SELECT } },
        },
        vocabLists: {
          include: {
            list: {
              include: LIST_INCLUDE,
            },
          },
        },
      },
    })
  }

  async bulkCreateMembers(entries: Array<{ classId: string; userId: string; role: 'STUDENT' | 'ASSISTANT' }>) {
    return this.prismaService.classMember.createMany({
      data: entries,
      skipDuplicates: true,
    })
  }

  async findUsersByEmails(emails: string[]) {
    return this.prismaService.user.findMany({
      where: { email: { in: emails }, deletedAt: null },
      select: USER_SELECT,
    })
  }

  async removeMember(classId: string, userId: string) {
    return this.prismaService.classMember.delete({
      where: { classId_userId: { classId, userId } },
    })
  }

  async transferMember(fromClassId: string, toClassId: string, userId: string) {
    return this.prismaService.$transaction([
      this.prismaService.classMember.delete({
        where: { classId_userId: { classId: fromClassId, userId } },
      }),
      this.prismaService.classMember.create({
        data: { classId: toClassId, userId, role: 'STUDENT' },
      }),
    ])
  }

  async findAssignedListIds(classId: string, listIds: string[]) {
    return this.prismaService.classVocabularyList.findMany({
      where: { classId, listId: { in: listIds } },
      select: { listId: true },
    })
  }

  async assignVocabLists(classId: string, listIds: string[]) {
    return this.prismaService.classVocabularyList.createMany({
      data: listIds.map((listId) => ({ classId, listId })),
      skipDuplicates: true,
    })
  }

  async grantListAccessToMembers(classId: string, listId: string, grantedBy: string) {
    const members = await this.prismaService.classMember.findMany({
      where: { classId },
      select: { userId: true },
    })

    if (members.length === 0) return

    return this.prismaService.vocabularyListAccess.createMany({
      data: members.map((m) => ({
        listId,
        userId: m.userId,
        classId,
        grantedBy,
      })),
      skipDuplicates: true,
    })
  }

  async findAssignedList(classId: string, listId: string) {
    return this.prismaService.classVocabularyList.findUnique({
      where: { classId_listId: { classId, listId } },
    })
  }

  async removeVocabList(classId: string, listId: string) {
    return this.prismaService.classVocabularyList.delete({
      where: { classId_listId: { classId, listId } },
    })
  }

  async findClassVocabLists(classId: string) {
    return this.prismaService.classVocabularyList.findMany({
      where: { classId },
      include: {
        list: {
          include: LIST_INCLUDE,
        },
      },
    })
  }

  async getClassStatistics(classId: string) {
    const [members, assignments] = await Promise.all([
      this.prismaService.classMember.findMany({
        where: { classId },
        include: {
          user: {
            select: {
              ...USER_SELECT,
              userStat: {
                select: {
                  totalWordsLearned: true,
                  learningStreak: true,
                  lastLearnDate: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.classVocabularyList.findMany({
        where: { classId },
        select: { listId: true },
      }),
    ])

    const listIds = assignments.map((a) => a.listId)

    const memberProgress = await Promise.all(
      members.map(async (member) => {
        const [listsCompleted, totalProgressPct] = await Promise.all([
          this.prismaService.userListProgress.count({
            where: { userId: member.userId, listId: { in: listIds }, completed: true },
          }),
          this.prismaService.userListProgress.aggregate({
            where: { userId: member.userId, listId: { in: listIds } },
            _avg: { progressPct: true },
          }),
        ])
        return {
          member,
          listsCompleted,
          overallProgressPct: totalProgressPct._avg.progressPct ?? 0,
        }
      }),
    )

    return { members, assignments, memberProgress, listIds }
  }

  async getMemberProgress(classId: string, userId: string) {
    const assignments = await this.prismaService.classVocabularyList.findMany({
      where: { classId },
      include: {
        list: {
          include: {
            _count: { select: { items: true } },
            items: {
              include: {
                vocabulary: {
                  include: {
                    userProgress: {
                      where: { userId, listId: { equals: undefined } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const listIds = assignments.map((a) => a.listId)

    const [listProgresses, wordProgresses] = await Promise.all([
      this.prismaService.userListProgress.findMany({
        where: { userId, listId: { in: listIds } },
      }),
      this.prismaService.userVocabularyProgress.findMany({
        where: { userId, listId: { in: listIds } },
        include: {
          vocabulary: { select: { word: true } },
        },
      }),
    ])

    return { assignments, listProgresses, wordProgresses }
  }

  async getClassMembersWithProgress(classId: string, listIds: string[]) {
    const members = await this.prismaService.classMember.findMany({
      where: { classId },
      include: { user: { select: USER_SELECT } },
      orderBy: { joinedAt: 'asc' },
    })

    const progresses = await this.prismaService.userListProgress.findMany({
      where: {
        userId: { in: members.map((m) => m.userId) },
        listId: { in: listIds },
      },
    })

    return { members, progresses }
  }

  async getClassMembers(classId: string) {
    return this.prismaService.classMember.findMany({
      where: { classId },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: USER_SELECT } },
    })
  }

  async getClassMaterialsForLearner(classId: string, userId: string) {
    const assignments = await this.prismaService.classVocabularyList.findMany({
      where: { classId },
      include: {
        list: {
          include: LIST_INCLUDE,
        },
      },
    })

    const listIds = assignments.map((a) => a.listId)

    const userProgresses = await this.prismaService.userListProgress.findMany({
      where: { userId, listId: { in: listIds } },
    })

    return { assignments, userProgresses }
  }
}
