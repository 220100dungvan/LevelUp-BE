import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { SpeakingService } from '@/modules/speaking/speaking.service'
import { SpeakingRepository } from '@/modules/speaking/speaking.repo'
import { TokenService } from '@/common/services/token.service'
import { UserRepository } from '@/modules/user/user.repo'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

type AuthenticatedSocket = TypedSocket & {
  userId: string
  fullName: string
  avatarUrl: string | null
  currentSessionId?: string
  micEnabled: boolean
}

export type ChatMessage = {
  from: {
    userId: string
    fullName: string
    avatarUrl: string | null
  }
  message: string
  timestamp: string
}

export type WebRTCSignal = RTCSessionDescriptionInit | RTCIceCandidateInit

type ServerToClientEvents = {
  match_found: (payload: { sessionId: string; roomName: string; partnerId: string; hostId: string }) => void
  user_joined: (payload: { userId: string; fullName: string; avatarUrl: string | null; micEnabled: boolean }) => void
  user_left: (payload: { userId: string; fullName: string; avatarUrl: string | null; newHostId?: string }) => void
  user_mic_toggled: (payload: { userId: string; micEnabled: boolean }) => void
  signal: (payload: { from: string; signal: WebRTCSignal }) => void
  chat_message: (payload: ChatMessage) => void
  session_ended: () => void
  error: (payload: { message: string }) => void
}

type ClientToServerEvents = {
  signal: (payload: { targetUserId: string; signal: WebRTCSignal }) => void
  chat_message: (payload: { message: string }) => void
  toggle_mic: (payload: { micEnabled: boolean }) => void
  leave_session: () => void
  join_room: (payload: { sessionId: string }, ack?: (payload: JoinRoomSnapshot) => void) => void
}

type JoinRoomSnapshot = {
  sessionId: string
  roomName: string
  hostId: string
  level: string
  maxMembers: number
  isPrivate: boolean
  status: string
  currentMemberCount: number
  participants: Array<{
    userId: string
    fullName: string | null
    avatarUrl: string | null
    isOnline: boolean
    micEnabled: boolean
    joinedAt: string
  }>
}

@WebSocketGateway({
  namespace: '/speaking',
  cors: { origin: '*' },
})
export class SpeakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>

  private readonly logger = new Logger(SpeakingGateway.name)

  // Map: socketId => { userId, sessionId }
  private readonly socketMap = new Map<string, { userId: string; sessionId?: string }>()

  // Map: userId => socketId  (for direct peer signaling)
  private readonly userSocketMap = new Map<string, string>()

  // Map: userId => micEnabled status
  private readonly userMicStatusMap = new Map<string, boolean>()

  constructor(
    private readonly speakingService: SpeakingService,
    private readonly speakingRepository: SpeakingRepository,
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || (client.handshake.headers.authorization?.split(' ')[1] ?? '')

      const payload = await this.tokenService.verifyAccessToken(token as string)
      client.userId = payload.userId

      // Lấy thêm thông tin người dùng để tiện cho việc hiển thị trong phòng chat mà không cần fetch lại từ DB nhiều lần
      try {
        const user = await this.userRepository.findUnique({ id: payload.userId })
        client.fullName = user?.fullName ?? ''
        client.avatarUrl = user?.avatarUrl ?? null
      } catch (err) {
        this.logger.warn(`Failed to fetch user profile for socket connection: ${(err as Error).message}`)
        client.fullName = ''
        client.avatarUrl = null
      }

      this.socketMap.set(client.id, { userId: payload.userId })
      this.userSocketMap.set(payload.userId, client.id)
      this.userMicStatusMap.set(payload.userId, true) // Mic enabled by default
      client.micEnabled = true

      this.logger.log(`User ${payload.userId} connected (socket: ${client.id})`)
    } catch {
      client.emit('error', { message: 'Unauthorized' })
      client.disconnect()
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const meta = this.socketMap.get(client.id)
    if (!meta) return

    const { userId, sessionId } = meta

    if (sessionId) {
      await this.handleUserLeaveSession(client, userId, sessionId)
    }

    // Clean up queue if user disconnects while searching
    if (this.speakingService.isUserInQueue(userId)) {
      this.speakingService.leaveQueue(userId)
    }

    this.socketMap.delete(client.id)
    this.userSocketMap.delete(userId)
    this.userMicStatusMap.delete(userId)
    this.logger.log(`User ${userId} disconnected`)
  }

  //Session Room Management

  /**
   * Called by REST controller after createSession / joinSession to place the
   * socket into the correct Socket.io room. FE should emit this right after
   * receiving the sessionId from the REST response.
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { sessionId: string }) {
    const { sessionId } = data
    const userId = client.userId

    // Verify user is a participant
    const participant = await this.speakingRepository.findParticipant(sessionId, userId)
    if (!participant) {
      throw new WsException('Error.NotInSession')
    }

    await client.join(sessionId)

    const meta = this.socketMap.get(client.id)
    if (meta) {
      meta.sessionId = sessionId
      this.socketMap.set(client.id, meta)
    }
    client.currentSessionId = sessionId

    // Notify others in room
    client.to(sessionId).emit('user_joined', {
      userId,
      fullName: client.fullName,
      avatarUrl: client.avatarUrl,
      micEnabled: client.micEnabled,
    })

    this.logger.log(`User ${userId} joined room ${sessionId}`)

    const session = await this.speakingRepository.findSessionById(sessionId)
    if (!session) {
      return
    }

    const snapshot: JoinRoomSnapshot = {
      sessionId: session.id,
      roomName: session.roomName,
      hostId: session.hostId,
      level: session.level,
      maxMembers: session.maxMembers,
      isPrivate: session.isPrivate,
      status: session.status,
      currentMemberCount: session.participants.filter((participant) => participant.isOnline).length,
      participants: session.participants.map((participant) => ({
        userId: participant.user.id,
        fullName: participant.user.fullName,
        avatarUrl: participant.user.avatarUrl,
        isOnline: participant.isOnline,
        micEnabled: this.userMicStatusMap.get(participant.user.id) ?? true,
        joinedAt: participant.joinedAt.toISOString(),
      })),
    }

    return snapshot
  }

  // WebRTC Signaling

  /**
   * Relay WebRTC signal (Offer / Answer / ICE Candidate) between peers.
   * data: { targetUserId: string, signal: RTCSessionDescription | RTCIceCandidate }
   */
  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; signal: RTCSessionDescriptionInit | RTCIceCandidateInit },
  ) {
    const targetSocketId = this.userSocketMap.get(data.targetUserId)
    if (!targetSocketId) {
      client.emit('error', { message: 'Error.PeerNotFound' })
      return
    }

    this.server.to(targetSocketId).emit('signal', {
      from: client.userId,
      signal: data.signal,
    })
  }

  @SubscribeMessage('toggle_mic')
  handleToggleMic(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { micEnabled: boolean }) {
    const sessionId = client.currentSessionId
    if (!sessionId) {
      throw new WsException('Error.NotInSession')
    }

    client.micEnabled = data.micEnabled
    this.userMicStatusMap.set(client.userId, data.micEnabled)

    // Broadcast mic status change to all users in the room
    this.server.to(sessionId).emit('user_mic_toggled', {
      userId: client.userId,
      micEnabled: data.micEnabled,
    })

    this.logger.log(`User ${client.userId} toggled mic to ${data.micEnabled}`)
  }

  // Chat

  /**
   * Broadcast a chat message to the room.
   * Chat is NOT persisted in DB (ephemeral).
   */
  @SubscribeMessage('chat_message')
  handleChatMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { message: string }) {
    const sessionId = client.currentSessionId
    this.logger.debug(`Received chat message from user ${client.userId} in session ${sessionId}: ${data.message}`)
    if (!sessionId) {
      throw new WsException('Error.NotInSession')
    }

    if (!data.message?.trim()) return

    // Broadcast to everyone in room INCLUDING sender for echo confirmation
    this.server.to(sessionId).emit('chat_message', {
      from: {
        userId: client.userId,
        fullName: client.fullName,
        avatarUrl: client.avatarUrl,
      },
      message: data.message.trim().slice(0, 500), // max 500 chars
      timestamp: new Date().toISOString(),
    })
  }

  //Leave Session

  @SubscribeMessage('leave_session')
  async handleLeaveSession(@ConnectedSocket() client: AuthenticatedSocket) {
    const sessionId = client.currentSessionId
    if (!sessionId) return

    await this.handleUserLeaveSession(client, client.userId, sessionId)
  }

  //Internal Helper
  private async handleUserLeaveSession(client: AuthenticatedSocket, userId: string, sessionId: string) {
    try {
      const result = await this.speakingService.leaveSession(sessionId, userId)

      client.to(sessionId).emit('user_left', {
        userId,
        fullName: client.fullName,
        avatarUrl: client.avatarUrl,
        newHostId: result.newHostId,
      })

      client.leave(sessionId)

      const meta = this.socketMap.get(client.id)
      if (meta) {
        meta.sessionId = undefined
        this.socketMap.set(client.id, meta)
      }
      client.currentSessionId = undefined

      this.logger.log(`User ${userId} left session ${sessionId}`)
    } catch (err) {
      this.logger.warn(`leaveSession error for user ${userId}: ${(err as Error).message}`)
    }
  }

  // Public Emitters (called from service after matchmaking)
  emitMatchFound(userId: string, payload: { sessionId: string; roomName: string; partnerId: string; hostId: string }) {
    const socketId = this.userSocketMap.get(userId)
    if (socketId) {
      this.server.to(socketId).emit('match_found', payload)
    }
  }

  emitSessionEnded(sessionId: string) {
    this.server.to(sessionId).emit('session_ended')
  }
}
