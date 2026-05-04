import { PrismaService } from '@/common/services/prisma.service'
import { Level, Prisma, SpeakingParticipant, SpeakingSession } from '@/generated/prisma/client'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SpeakingRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findParticipant(sessionId: string, userId: string) {
    return this.prismaService.speakingParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    })
  }

  findSessionById(id: string) {
    return this.prismaService.speakingSession.findUnique({
      where: { id },
      include: {
        topics: { include: { topic: true } },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })
  }

  async countOnlineParticipants(sessionId: string): Promise<number> {
    return this.prismaService.speakingParticipant.count({
      where: { sessionId, isOnline: true },
    })
  }

  async updateParticipantStatus(sessionId: string, userId: string, data: Prisma.SpeakingParticipantUpdateInput) {
    return this.prismaService.speakingParticipant.update({
      where: { sessionId_userId: { sessionId, userId } },
      data,
    })
  }

  async updateSessionStatus(id: string, data: Prisma.SpeakingSessionUpdateInput) {
    return this.prismaService.speakingSession.update({
      where: { id },
      data,
    })
  }

  findAllTopics() {
    return this.prismaService.speakingTopic.findMany({
      orderBy: { name: 'asc' },
    })
  }

  async findAvailableSessions(params: { level?: string; topicIds?: string[]; page: number; limit: number }) {
    const { level, topicIds, page, limit } = params
    const skip = (page - 1) * limit

    const where: Prisma.SpeakingSessionWhereInput = {
      status: 'WAITING',
      ...(level ? { level: level as Level } : {}),
      ...(topicIds && topicIds.length > 0
        ? {
            topics: {
              some: { topicId: { in: topicIds } },
            },
          }
        : {}),
    }

    const [sessions, total] = await Promise.all([
      this.prismaService.speakingSession.findMany({
        where,
        include: {
          topics: { include: { topic: true } },
          participants: {
            where: { isOnline: true },
            include: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
          _count: { select: { participants: { where: { isOnline: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.speakingSession.count({ where }),
    ])

    // Filter out full rooms (current members < maxMembers)
    const availableSessions = sessions.filter((s) => s._count.participants < s.maxMembers)

    return { sessions: availableSessions, total }
  }

  async createSession(
    payload: Pick<SpeakingSession, 'roomName' | 'hostId' | 'level' | 'maxMembers' | 'isPrivate'> & {
      passcode?: string | null
      topicIds: string[]
    },
  ): Promise<SpeakingSession> {
    const { topicIds, ...sessionData } = payload
    return this.prismaService.speakingSession.create({
      data: {
        ...sessionData,
        topics: {
          create: topicIds.map((topicId) => ({ topicId })),
        },
        participants: {
          create: {
            userId: payload.hostId,
            isOnline: true,
          },
        },
      },
    })
  }

  async addParticipant(sessionId: string, userId: string): Promise<SpeakingParticipant> {
    return this.prismaService.speakingParticipant.create({
      data: { sessionId, userId, isOnline: true },
    })
  }
}
