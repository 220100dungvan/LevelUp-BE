import { SpeakingRepository } from '@/modules/speaking/speaking.repo'
import {
  CreateSessionBodyType,
  GetSessionsQueryType,
  JoinQueueBodyType,
  JoinSessionBodyType,
} from '@/modules/speaking/speaking.schema'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class SpeakingService {
  // Thay bằng một hệ thống queue thực thụ để mở rộng sau này (ví dụ RabbitMQ, Redis Queue...), hiện tại dùng Map đơn giản để demo
  private readonly queue: Map<string, { userId: string; level: string; topicIds: string[]; joinedAt: Date }> = new Map()

  constructor(private readonly speakingRepository: SpeakingRepository) {}

  leaveQueue(userId: string) {
    if (!this.queue.has(userId)) {
      throw new BadRequestException('Error.NotInQueue')
    }
    this.queue.delete(userId)
    return { message: 'Đã hủy tìm kiếm' }
  }

  isUserInQueue(userId: string) {
    return this.queue.has(userId)
  }

  async leaveSession(sessionId: string, userId: string) {
    const session = await this.speakingRepository.findSessionById(sessionId)
    if (!session) throw new NotFoundException('Error.SessionNotFound')

    const participant = await this.speakingRepository.findParticipant(sessionId, userId)
    if (!participant || !participant.isOnline) {
      throw new BadRequestException('Error.NotInSession')
    }

    await this.speakingRepository.updateParticipantStatus(sessionId, userId, {
      isOnline: false,
      leftAt: new Date(),
    })

    const onlineCount = await this.speakingRepository.countOnlineParticipants(sessionId)
    let _newHostId = ''

    // Nếu không còn ai online, kết thúc phiên
    if (onlineCount === 0) {
      await this.speakingRepository.updateSessionStatus(sessionId, {
        status: 'ENDED',
        endedAt: new Date(),
      })
    } else if (session.hostId === userId && onlineCount > 0) {
      // Nếu host rời đi và vẫn còn người online, chọn ngẫu nhiên một host mới
      const updatedSession = await this.speakingRepository.findSessionById(sessionId)
      if (updatedSession) {
        const onlineParticipants = updatedSession.participants.filter((p) => p.isOnline)

        if (onlineParticipants.length > 0) {
          const randomNewHost = onlineParticipants[Math.floor(Math.random() * onlineParticipants.length)]
          await this.speakingRepository.updateSessionStatus(sessionId, {
            host: { connect: { id: randomNewHost.userId } },
          })
          _newHostId = randomNewHost.userId
        }
      }
    } else if (session.status === 'MATCHED' && onlineCount < session.maxMembers) {
      // Nếu phiên đang MATCHED nhưng số người online giảm xuống dưới maxMembers, chuyển lại thành WAITING để chờ thêm người
      await this.speakingRepository.updateSessionStatus(sessionId, { status: 'WAITING' })
    }

    return { newHostId: _newHostId }
  }

  async getTopics() {
    const topics = await this.speakingRepository.findAllTopics()
    return { data: topics }
  }

  async getSessions(query: GetSessionsQueryType) {
    const { sessions, total } = await this.speakingRepository.findAvailableSessions({
      level: query.level,
      topicIds: query.topicIds,
      page: query.page,
      limit: query.limit,
    })

    // Sort: rooms with more matching topics first
    const topicIds = query.topicIds ?? []
    const sorted =
      topicIds.length > 0
        ? sessions.sort((a, b) => {
            const aMatches = a.topics.filter((t) => topicIds.includes(t.topicId)).length
            const bMatches = b.topics.filter((t) => topicIds.includes(t.topicId)).length
            return bMatches - aMatches
          })
        : sessions

    const data = sorted.map((s) => ({
      id: s.id,
      roomName: s.roomName,
      hostId: s.hostId,
      level: s.level,
      maxMembers: s.maxMembers,
      isPrivate: s.isPrivate,
      status: s.status,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
      topics: s.topics.map((t) => ({ id: t.topic.id, name: t.topic.name })),
      participants: s.participants.map((p) => ({
        userId: p.user.id,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        isOnline: p.isOnline,
        joinedAt: p.joinedAt,
      })),
      currentMemberCount: s._count.participants,
    }))

    return { data, total, page: query.page, limit: query.limit }
  }

  async createSession(userId: string, body: CreateSessionBodyType) {
    const session = await this.speakingRepository.createSession({
      roomName: body.roomName,
      hostId: userId,
      level: body.level,
      maxMembers: body.maxMembers,
      isPrivate: body.isPrivate,
      passcode: body.passcode ?? null,
      topicIds: body.topicIds,
    })

    return {
      sessionId: session.id,
      roomName: session.roomName,
      hostId: session.hostId,
    }
  }

  // Hàm tìm kiếm match trong queue
  private findMatch(userId: string) {
    const requester = this.queue.get(userId)
    if (!requester) return null

    for (const [candidateId, candidate] of this.queue.entries()) {
      if (candidateId === userId) continue
      if (candidate.level !== requester.level) continue
      const commonTopics = candidate.topicIds.filter((t) => requester.topicIds.includes(t))
      if (commonTopics.length > 0) return candidate
    }
    return null
  }

  async joinQueue(userId: string, body: JoinQueueBodyType) {
    if (this.queue.has(userId)) {
      throw new BadRequestException('Error.AlreadyInQueue')
    }

    this.queue.set(userId, {
      userId,
      level: body.level,
      topicIds: body.topicIds,
      joinedAt: new Date(),
    })

    // Thử tìm match ngay khi join queue
    const match = this.findMatch(userId)

    if (match) {
      // Nếu tìm được match, xóa cả 2 khỏi queue
      this.queue.delete(userId)
      this.queue.delete(match.userId)

      // Tạo session mới cho 2 người
      const session = await this.speakingRepository.createSession({
        roomName: `Quick Match – ${new Date().toISOString()}`,
        hostId: userId,
        level: body.level,
        maxMembers: 2,
        isPrivate: false,
        passcode: null,
        topicIds:
          body.topicIds.filter((id) => match.topicIds.includes(id)).length > 0
            ? body.topicIds.filter((id) => match.topicIds.includes(id))
            : body.topicIds,
      })

      await this.speakingRepository.addParticipant(session.id, match.userId)

      // Thông báo cho cả 2 người về phiên mới qua Socket.io (controller sẽ handle phần này)
      return {
        message: 'Tìm thấy đối tác!',
        matched: true,
        roomName: session.roomName,
        sessionId: session.id,
        partnerId: match.userId,
        hostId: userId,
      }
    }

    const position = Array.from(this.queue.keys()).indexOf(userId) + 1
    return {
      message: 'Đã vào hàng đợi. Đang tìm đối tác...',
      matched: false,
      queuePosition: position,
    }
  }

  async joinSession(sessionId: string, userId: string, body: JoinSessionBodyType) {
    const session = await this.speakingRepository.findSessionById(sessionId)

    if (!session) {
      throw new NotFoundException('Error.SessionNotFound')
    }

    if (session.status !== 'WAITING') {
      throw new BadRequestException('Error.SessionNotAvailable')
    }

    const onlineCount = await this.speakingRepository.countOnlineParticipants(sessionId)
    if (onlineCount >= session.maxMembers) {
      throw new BadRequestException('Error.SessionFull')
    }

    if (session.isPrivate) {
      if (!body.passcode) {
        throw new ForbiddenException('Error.PasscodeRequired')
      }
      if (session.passcode !== body.passcode) {
        throw new ForbiddenException('Error.InvalidPasscode')
      }
    }

    // Re-join if participant already exists but went offline
    const existing = await this.speakingRepository.findParticipant(sessionId, userId)
    if (existing) {
      if (existing.isOnline) {
        throw new BadRequestException('Error.AlreadyInSession')
      }
      await this.speakingRepository.updateParticipantStatus(sessionId, userId, {
        isOnline: true,
        leftAt: null,
      })
    } else {
      await this.speakingRepository.addParticipant(sessionId, userId)
    }

    // If room is now full, update status to MATCHED
    const newCount = onlineCount + 1
    if (newCount >= session.maxMembers) {
      await this.speakingRepository.updateSessionStatus(sessionId, { status: 'MATCHED' })
    }

    return { sessionId, roomName: session.roomName, hostId: session.hostId }
  }
}
