import { UserRoleType } from '@/common/constants/auth.constant'

export interface AccessTokenPayloadCreate {
  userId: string
  deviceId: number
  role: UserRoleType
}

export interface AccessTokenPayload extends AccessTokenPayloadCreate {
  exp: number
  iat: number
}

export interface RefreshTokenPayloadCreate {
  userId: string
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  exp: number
  iat: number
}

export interface DictationSubmitPayload {
  sessionId: number
  sentenceId: number
  userText: string
  replayCount?: number
}

export interface LoginTokenPayloadCreate {
  userId: string
}

export interface LoginTokenPayload extends LoginTokenPayloadCreate {
  exp: number
  iat: number
}
