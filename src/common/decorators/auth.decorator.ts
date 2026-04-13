import {
  AUTH_TYPE_KEY,
  AuthType,
  AuthTypeEnum,
  ConditionGuard,
  ConditionGuardType,
} from '@/common/constants/auth.constant'
import { SetMetadata } from '@nestjs/common'

export type AuthTypeDecoratorPayload = { authTypes: AuthTypeEnum[]; options: { condition: ConditionGuardType } }

export const Auth = (authTypes: AuthTypeEnum[], options?: { condition: ConditionGuardType }) => {
  return SetMetadata(AUTH_TYPE_KEY, { authTypes, options: options ?? { condition: ConditionGuard.And } })
}

export const IsPublic = () => Auth([AuthType.None])
