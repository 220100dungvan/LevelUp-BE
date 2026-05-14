import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import {
  DisableTwoFactorBodyDTO,
  ForgotPasswordBodyDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
  TwoFactorSetupResDTO,
  VerifyTwoFactorSetupBodyDTO,
} from '@/modules/auth/auth.dto'
import { AuthService } from '@/modules/auth/auth.service'
import { IsPublic } from '@/common/decorators/auth.decorator'
import { UserAgent } from '@/common/decorators/user-agent.decorator'
import { ActiveUser } from '@/common/decorators/active-user.decorator'
import type { UserRoleType } from '@/common/constants/auth.constant'
import { MessageResDTO } from '@/common/dtos/response.dto'
import { EmptyBodyDTO } from '@/common/dtos/request.dto'
import { Throttle } from '@nestjs/throttler'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @IsPublic()
  @ZodResponse({ type: RegisterResDTO })
  register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body)
  }

  @Post('otp')
  @IsPublic()
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body)
  }

  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('login')
  @IsPublic()
  @ZodResponse({ type: LoginResDTO })
  login(
    @Body() body: LoginBodyDTO,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
    @ActiveUser('role') role: UserRoleType,
  ) {
    return this.authService.login({ ...body, userAgent, ip, role })
  }

  @Post('refresh-token')
  @IsPublic()
  @ZodResponse({ type: RefreshTokenResDTO })
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.refreshToken({ refreshToken: body.refreshToken, userAgent, ip })
  }

  @Post('logout')
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body.refreshToken)
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodResponse({ type: MessageResDTO })
  forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body)
  }

  @Post('2fa/setup')
  @ZodResponse({ type: TwoFactorSetupResDTO })
  setupTwoFactorAuth(@Body() _: EmptyBodyDTO, @ActiveUser('userId') userId: string) {
    return this.authService.setupTwoFactorAuth(userId)
  }

  @Post('2fa/verify-setup')
  @ZodResponse({ type: MessageResDTO })
  verifySetupTwoFactorAuth(@Body() body: VerifyTwoFactorSetupBodyDTO, @ActiveUser('userId') userId: string) {
    return this.authService.verifySetupTwoFactorAuth({
      totpCode: body.totpCode,
      userId,
    })
  }

  @Post('2fa/disable')
  @ZodResponse({ type: MessageResDTO })
  disableTwoFactorAuth(@Body() body: DisableTwoFactorBodyDTO, @ActiveUser('userId') userId: string) {
    return this.authService.disableTwoFactorAuth({
      ...body,
      userId,
    })
  }
}
