import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import {
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  LogoutBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constants'
import { EmailService } from 'src/shared/services/email.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import { RefreshTokenBodyDTO } from 'src/routes/auth/auth.dto'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  InvalidOTPException,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  OTPExpiredException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
} from 'src/routes/auth/auth.error'
import { TwoFactorService } from 'src/shared/services/2fa.service'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
@Injectable()
export class AuthService {
  constructor(
    private readonly hashService: HashingService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly sharedRoleRepository: SharedRoleRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
  ) {}
  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfVerificationCodeType
  }) {
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email_code_type: {
        email,
        code,
        type,
      },
    })
    if (!verificationCode) {
      throw InvalidOTPException
    }
    if (verificationCode.expiresAt < new Date()) {
      throw OTPExpiredException
    }
    return verificationCode
  }
  async register(body: RegisterBodyType) {
    const { email, code, name, phoneNumber } = body
    try {
      await this.validateVerificationCode({
        email,
        code,
        type: TypeOfVerificationCode.REGISTER,
      })

      const clientRoleId = await this.sharedRoleRepository.getClientRoleId()
      const hashedPassword = await this.hashService.hash(body.password)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email,
          name,
          phoneNumber,
          password: hashedPassword,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_code_type: {
            email,
            code,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists')
      }
      throw error
    }
  }
  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra email đã tồn tại trong database hay chưa
    const user = await this.sharedUserRepository.findUnique({
      email: body.email,
    })
    if (body.type === TypeOfVerificationCode.REGISTER && user) {
      throw EmailAlreadyExistsException
    }
    if (body.type === TypeOfVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotFoundException
    }
    // 2. Tạo mã OTP
    const code = generateOTP()
    await this.authRepository.createVerificationCode({
      email: body.email,
      type: body.type,
      code,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })
    // 3. Gửi mã OTP
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    })
    if (error) {
      console.log(error)
      throw new UnprocessableEntityException({
        message: 'Failed to send OTP',
        path: 'code',
      })
    }
    return {
      message: 'OTP sent successfully.',
    }
  }
  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    // 1. Lấy thông tin user từ database
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    })
    if (!user) {
      // không tìm thấy tài khoản
      throw new UnprocessableEntityException({
        message: 'Account is not exist',
        path: 'email',
      })
    }
    const isPasswordMatch = await this.hashService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      // mật khẩu không đúng
      throw new UnprocessableEntityException([
        {
          path: 'password',
          error: 'Password is incorrect',
        },
      ])
    }
    // 2. Kiểm tra user có bật 2FA hay không, nếu có kiểm tra mã TOTP Code hoặc mã OTP
    if (user.totpSecret) {
      // có totpSecret nghĩa là đã bật 2FA
      if (!body.totpCode && !body.code) {
        throw InvalidTOTPAndCodeException
      }
      if (body.totpCode) {
        const invalid = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        })
        if (!invalid) {
          throw InvalidTOTPException
        }
      } else if (body.code) {
        await this.validateVerificationCode({
          email: user.email,
          code: body.code,
          type: TypeOfVerificationCode.LOGIN,
        })
      }
    }
    // 3. Tạo device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })
    // 4. Tạo access token và refresh token
    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })
    return tokens
  }
  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ])
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      deviceId,
    })
    return { accessToken, refreshToken }
  }
  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyDTO & { userAgent: string; ip: string }) {
    try {
      // 1. Kiểm tra xem refresh token có hợp lệ không
      const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra xem refresh token có tồn tại trong cơ sở dữ liệu không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
        // check revoked token
        // throw mã lỗi 'P2025'
      })
      if (!refreshTokenInDb) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDb
      // 3. Cập nhật device
      const $updateDevice = this.authRepository.deviceUpdate(deviceId, { userAgent, ip })
      // 4. Xóa refreshToken cũ
      const $deletedRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      }) // revoke sau khi dùng
      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({
        userId: decodedRefreshToken.userId,
        deviceId,
        roleId: roleId,
        roleName: roleName,
      })
      const [, , tokens] = await Promise.all([$updateDevice, $deletedRefreshToken, $tokens])
      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }
  async logout(body: LogoutBodyType) {
    try {
      // 1. Kiểm tra xem refresh token có hợp lệ không
      await this.tokenService.verifyRefreshToken(body.refreshToken)
      // 2. Xóa refreshToken trong database
      const { deviceId } = await this.authRepository.deleteRefreshToken({
        token: body.refreshToken,
        // check revoked token
        // throw mã lỗi 'P2025'
      })
      // 3. Update device đã logout
      await this.authRepository.deviceUpdate(deviceId, {
        isActive: false,
      })
      return { message: 'Logout successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      throw new UnauthorizedException()
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body
    // 1. Kiểm tra email có tồn tại trong database hay không
    const user = await this.sharedUserRepository.findUnique({ email })
    if (!user) {
      throw EmailNotFoundException
    }
    // 2. Kiểm tra mã OTP có hợp lệ không
    await this.validateVerificationCode({
      email,
      code,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    })
    // 3. Cập nhật mật khẩu mới và xóa mã OTP
    const hashedNewPassword = await this.hashService.hash(newPassword)
    const $user = this.sharedUserRepository.update(
      {
        id: user.id,
      },
      { password: hashedNewPassword, updatedById: user.id },
    )
    const $deletedVerificationCode = this.authRepository.deleteVerificationCode({
      email_code_type: {
        email,
        code,
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      },
    })
    await Promise.all([$user, $deletedVerificationCode])
    return {
      message: 'Password has been reset successfully.',
    }
  }
  async setupTwoFactorAuth(userId: number) {
    // 1. Lấy thông tin user, kiểm tra user đã bật 2FA hay chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotFoundException
    }
    if (user.totpSecret) {
      throw TOTPAlreadyEnabledException
    }
    // 2. Tạo secret và uri
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email)
    // 3. Lưu secret vào user trong database
    await this.sharedUserRepository.update({ id: userId }, { totpSecret: secret, updatedById: userId })
    // 4. Trả về secret và uri
    return { secret, uri }
  }
  async disableTwoFactorAuth(data: DisableTwoFactorBodyType & { userId: number }) {
    const { userId, totpCode, code } = data
    // 1. Kiểm tra user có tồn tại không, đã bật 2FA hay chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotFoundException
    }
    if (!user.totpSecret) {
      throw TOTPNotEnabledException
    }
    // 2. Kiểm tra mã TOTP Code có hợp lệ không
    if (totpCode) {
      const invalid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })
      if (!invalid) {
        throw InvalidTOTPException
      }
    } else if (code) {
      // 3. Kiểm tra mã OTP có hợp lệ không
      await this.validateVerificationCode({
        email: user.email,
        code,
        type: TypeOfVerificationCode.DISABLE_2FA,
      })
    }
    // 4. Cập nhật user bỏ 2FA
    await this.sharedUserRepository.update({ id: userId }, { totpSecret: null, updatedById: userId })
    return {
      message: 'Two-factor authentication has been disabled successfully.',
    }
  }
}
