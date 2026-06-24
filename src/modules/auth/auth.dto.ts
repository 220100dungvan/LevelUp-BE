import {
  DisableTwoFactorBodySchema,
  ForgotPasswordBodySchema,
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPBodySchema,
  TwoFactorSetupResSchema,
  VerifyLoginTwoFactorBodySchema,
  VerifyLoginTwoFactorResSchema,
  VerifyTwoFactorSetupBodySchema,
} from '@/modules/auth/auth.schema'
import { createZodDto } from 'nestjs-zod'

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export class RegisterResDTO extends createZodDto(RegisterResSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class VerifyLoginTwoFactorBodyDTO extends createZodDto(VerifyLoginTwoFactorBodySchema) {}

export class VerifyLoginTwoFactorResDTO extends createZodDto(VerifyLoginTwoFactorResSchema) {}

export class LoginResDTO extends createZodDto(LoginResSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {}

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}

export class ForgotPasswordBodyDTO extends createZodDto(ForgotPasswordBodySchema) {}

export class TwoFactorSetupResDTO extends createZodDto(TwoFactorSetupResSchema) {}

export class VerifyTwoFactorSetupBodyDTO extends createZodDto(VerifyTwoFactorSetupBodySchema) {}

export class DisableTwoFactorBodyDTO extends createZodDto(DisableTwoFactorBodySchema) {}
