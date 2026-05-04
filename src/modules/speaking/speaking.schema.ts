import { Level } from '@/common/constants/vocabulary.constant'
import z from 'zod'

export const SpeakingSessionStatus = {
  WAITING: 'WAITING',
  MATCHED: 'MATCHED',
  ENDED: 'ENDED',
} as const

export const ParticipantRole = {
  HOST: 'HOST',
  MEMBER: 'MEMBER',
} as const

export const SpeakingTopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export const GetSpeakingTopicsResSchema = z.object({
  data: z.array(SpeakingTopicSchema),
})

export const CreateSessionBodySchema = z
  .object({
    roomName: z.string().min(3).max(100),
    level: z.enum([Level.Advanced, Level.Intermediate, Level.Beginner]),
    maxMembers: z.number().int().min(2).max(5).default(2),
    isPrivate: z.boolean().default(false),
    passcode: z.string().min(4).max(20).optional(),
    topicIds: z.array(z.string().uuid()).max(5),
  })
  .strict()
  .superRefine(({ isPrivate, passcode }, ctx) => {
    if (isPrivate && !passcode) {
      ctx.addIssue({
        code: 'custom',
        message: 'Phòng riêng tư phải có passcode',
        path: ['passcode'],
      })
    }
  })

export const JoinSessionBodySchema = z
  .object({
    passcode: z.string().optional(),
  })
  .strict()

export const GetSessionsQuerySchema = z.object({
  level: z.enum([Level.Advanced, Level.Intermediate, Level.Beginner]).optional(),
  topicIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const JoinQueueBodySchema = z
  .object({
    level: z.enum([Level.Advanced, Level.Intermediate, Level.Beginner]),
    topicIds: z.array(z.string().uuid()).max(5),
  })
  .strict()

export const ParticipantSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isOnline: z.boolean(),
  joinedAt: z.date(),
})

export const SessionDetailSchema = z.object({
  id: z.string().uuid(),
  roomName: z.string(),
  hostId: z.string().uuid(),
  level: z.enum([Level.Advanced, Level.Intermediate, Level.Beginner]),
  maxMembers: z.number(),
  isPrivate: z.boolean(),
  status: z.enum([SpeakingSessionStatus.WAITING, SpeakingSessionStatus.MATCHED, SpeakingSessionStatus.ENDED]),
  createdAt: z.date(),
  endedAt: z.date().nullable(),
  topics: z.array(SpeakingTopicSchema),
  participants: z.array(ParticipantSchema),
  currentMemberCount: z.number(),
})

export const CreateSessionResSchema = z.object({
  sessionId: z.string().uuid(),
  roomName: z.string(),
  hostId: z.string().uuid(),
})

export const JoinSessionResSchema = z.object({
  sessionId: z.string().uuid(),
  roomName: z.string(),
  hostId: z.string().uuid(),
})

export const GetSessionsResSchema = z.object({
  data: z.array(SessionDetailSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const JoinQueueResSchema = z.object({
  message: z.string(),
  matched: z.boolean(),
  sessionId: z.string().uuid().optional(),
  roomName: z.string().optional(),
  isHost: z.boolean().optional(),
  partnerId: z.string().uuid().optional(),
  queuePosition: z.number().optional(),
})

export type CreateSessionBodyType = z.infer<typeof CreateSessionBodySchema>
export type JoinSessionBodyType = z.infer<typeof JoinSessionBodySchema>
export type GetSessionsQueryType = z.infer<typeof GetSessionsQuerySchema>
export type JoinQueueBodyType = z.infer<typeof JoinQueueBodySchema>
export type SessionDetailType = z.infer<typeof SessionDetailSchema>
export type SpeakingTopicType = z.infer<typeof SpeakingTopicSchema>
