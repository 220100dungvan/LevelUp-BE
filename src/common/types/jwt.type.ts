import { UserRoleType } from '@/common/constants/auth.constant'

export interface AccessTokenPayloadCreate {
  userId: number
  deviceId: number
  role: UserRoleType
}

export interface AccessTokenPayload extends AccessTokenPayloadCreate {
  exp: number
  iat: number
}

export interface RefreshTokenPayloadCreate {
  userId: number
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  exp: number
  iat: number
}
