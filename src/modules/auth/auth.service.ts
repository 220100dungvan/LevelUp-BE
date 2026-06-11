import { TypeOfVerificationCode, TypeOfVerificationCodeType } from '@/common/constants/auth.constant'
import { EmailService } from '@/common/emails/email.service'
import { TwoFactorService } from '@/common/services/2fa.service'
import { HashingService } from '@/common/services/hashing.service'
import { TokenService } from '@/common/services/token.service'
import { AccessTokenPayloadCreate } from '@/common/types/jwt.type'
import envConfig from '@/common/utils/config'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from '@/common/utils/helpers'
import { AuthRepository } from '@/modules/auth/auth.repo'
import {
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from '@/modules/auth/auth.schema'
import { UserRepository } from '@/modules/user/user.repo'
import { HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms, { StringValue } from 'ms'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly userRepository: UserRepository,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        type: TypeOfVerificationCode.REGISTER,
      })

      const hashedPassword = await this.hashingService.hash(body.password)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          fullName: body.name,
          password: hashedPassword,
          role: body.role,
        }),
        this.authRepository.deleteVerificationCode({
          email_type: {
            email: body.email,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnprocessableEntityException([
          {
            message: 'Error.EmailAlreadyExists',
          },
        ])
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    //1. Kiểm tra xem email đã tồn tại trong bảng User chưa
    const user = await this.userRepository.findUnique({ email: body.email })
    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.EmailAlreadyExists',
          path: 'email',
        },
      ])
    }
    //2. Tạo  mã OTP
    const code = generateOTP()
    await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as StringValue)),
    })
    // 3. Gửi mã OTP -  Đẩy vào queue
    await this.emailService.sendOTP({ email: body.email, code })
    return { message: 'Gửi mã OTP thành công' }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    //1. Kiểm tra email có tồn tại không
    const user = await this.authRepository.findUniqueUser({
      email: body.email,
    })

    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.EmailNotFound',
        },
      ])
    }
    //2. Kiểm tra mật khẩu có đúng không
    const isValidPassword = await this.hashingService.compare(body.password, user.password)

    if (!isValidPassword) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.InvalidPassword',
          path: 'password',
        },
      ])
    }

    //3. Nếu user đã bật mã 2FA thì kiểm tra mã 2FA TOTP Code hoặc OTP Code (email)
    if (user.totpSecret) {
      // Nếu không có mã TOTP Code và Code thì thông báo cho client biết
      if (!body.totpCode && !body.code) {
        throw new UnprocessableEntityException([
          {
            message: 'Error.InvalidTOTPAndCode',
          },
        ])
      }
      if (body.totpCode) {
        const isValidTOTP = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        })
        if (!isValidTOTP) {
          throw new UnprocessableEntityException([
            {
              message: 'Error.InvalidTOTP',
            },
          ])
        }
      } else if (body.code) {
        await this.validateVerificationCode({
          email: body.email,
          type: TypeOfVerificationCode.LOGIN,
        })
      }
    }
    //4. Tạo device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })
    //5. Tạo access token & refresh token
    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      role: user.role,
    })
    return tokens
  }

  async generateTokens({ userId, deviceId, role }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      Promise.resolve(
        this.tokenService.signAccessToken({
          userId,
          deviceId,
          role,
        }),
      ),
      Promise.resolve(
        this.tokenService.signRefreshToken({
          userId,
        }),
      ),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)

    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      deviceId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    })
    return { accessToken, refreshToken }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      //1.Xác thực refresh token
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)
      //2.Kiểm tra token có trong db ko
      const storedRefreshToken = await this.authRepository.findUniqueRefreshTokenIncludeUser({
        token: refreshToken,
      })
      if (!storedRefreshToken) {
        // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
        // refresh token của họ đã bị đánh cắp
        throw new UnauthorizedException('Error.RefreshTokenAlreadyUsed')
      }
      const {
        deviceId,
        user: { role },
      } = storedRefreshToken
      //3.Cập nhật Device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      })
      //4. Xóa refresh token cũ trong db
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      //5. Tạo mới cặp access token & refresh token
      const $tokens = this.generateTokens({ userId, role, deviceId })
      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens])
      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException('Error.Unauthorized')
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Xóa refreshToken trong database
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({ token: refreshToken })
      // 3. Cập nhật device là đã logout
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      })
      return { message: 'Đăng xuất thành công' }
    } catch (error) {
      // nếu refresh token không hợp lệ hoặc không tìm thấy trong db
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Error.RefreshTokenAlreadyUsed')
      }
      throw new UnauthorizedException('Error.Unauthorized')
    }
  }

  async validateVerificationCode({ email, type }: { email: string; type: TypeOfVerificationCodeType }) {
    const vevificationCode = await this.authRepository.findUniqueVerificationCode({
      email_type: {
        email,
        type,
      },
    })
    if (!vevificationCode) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.InvalidOTP',
          path: 'code',
        },
      ])
    }
    if (vevificationCode.expiresAt < new Date()) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.OTPExpired',
          path: 'code',
        },
      ])
    }
    return vevificationCode
  }
  async forgotPassword(body: ForgotPasswordBodyType) {
    //1. Kiểm tra email có tồn tại không
    const user = await this.userRepository.findUnique({ email: body.email })
    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.EmailNotFound',
          path: 'email',
        },
      ])
    }
    //2. Kiểm tra mã OTP ( có tồn tại & chưa hết hạn)
    await this.validateVerificationCode({
      email: body.email,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    })
    //3. Cập nhật mật khẩu mới
    const hashedPassword = await this.hashingService.hash(body.newPassword)
    //4. Xoá mã OTP có type là FORGOT_PASSWORD đã sử dụng cho email này
    await Promise.all([
      this.userRepository.update(
        { id: user.id },
        {
          password: hashedPassword,
        },
      ),
      this.authRepository.deleteVerificationCode({
        email_type: {
          email: body.email,
          type: TypeOfVerificationCode.FORGOT_PASSWORD,
        },
      }),
    ])
    return { message: 'Cập nhật mật khẩu mới thành công' }
  }

  async setupTwoFactorAuth(userId: string) {
    // 1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không, và xem họ đã bật 2FA chưa
    const user = await this.userRepository.findUnique({ id: userId })
    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.UserNotFound',
          path: 'userId',
        },
      ])
    }
    if (user.totpEnabled) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.TOTPAlreadyEnabled',
          path: 'userId',
        },
      ])
    }
    // 2. Tạo ra secret và uri
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email)
    console.log('SETUP SECRET:', secret)
    await this.userRepository.update(
      { id: userId },
      {
        totpSecret: secret,
        totpEnabled: false,
      },
    )
    // 3. Trả về secret và uri
    return {
      secret,
      uri,
    }
  }

  async verifySetupTwoFactorAuth({ totpCode, userId }: { totpCode: string; userId: string }) {
    // 1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không, và xem họ đã bật 2FA chưa
    const user = await this.userRepository.findUnique({ id: userId })
    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.UserNotFound',
          path: 'userId',
        },
      ])
    }
    // 2. Nếu đã bật 2FA thì chặn
    if (user.totpEnabled) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.TOTPAlreadyEnabled',
          path: 'userId',
        },
      ])
    }
    console.log('VERIFY SECRET:', user.totpSecret)
    // 3. Phải có secret đã lưu từ bước setup
    if (!user.totpSecret) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.TOTPSetupNotInitiated',
          path: 'userId',
        },
      ])
    }
    // Xác thực mã TOTP
    const isValidTOTP = this.twoFactorService.verifyTOTP({
      email: user.email,
      token: totpCode,
      secret: user.totpSecret,
    })
    if (!isValidTOTP) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.InvalidTOTP',
          path: 'totpCode',
        },
      ])
    }
    // 3. Lưu secret vào database
    await this.userRepository.update(
      { id: userId },
      {
        totpEnabled: true,
        updatedAt: new Date(),
      },
    )
    return { message: 'Thiết lập 2FA thành công' }
  }

  async disableTwoFactorAuth(data: DisableTwoFactorBodyType & { userId: string }) {
    const { userId, totpCode, code } = data
    // 1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không, và xem họ đã bật 2FA chưa
    const user = await this.userRepository.findUnique({ id: userId })
    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.UserNotFound',
          path: 'userId',
        },
      ])
    }
    if (!user.totpSecret) {
      throw new UnprocessableEntityException([
        {
          message: 'Error.TOTPNotEnabled',
          path: 'userId',
        },
      ])
    }

    // 2. Kiểm tra mã TOTP có hợp lệ hay không
    if (totpCode) {
      const isValid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })
      if (!isValid) {
        throw new UnprocessableEntityException([
          {
            message: 'Error.InvalidTOTP',
            path: 'totpCode',
          },
        ])
      }
    } else if (code) {
      // 3. Kiểm tra mã OTP email có hợp lệ hay không
      await this.validateVerificationCode({
        email: user.email,
        type: TypeOfVerificationCode.DISABLE_2FA,
      })
    }

    // 4. Cập nhật secret thành null
    await this.userRepository.update({ id: userId }, { totpSecret: null, updatedAt: new Date() })

    // 5. Trả về thông báo
    return {
      message: 'Tắt 2FA thành công',
    }
  }
}
