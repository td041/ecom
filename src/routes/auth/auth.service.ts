import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import { LoginBodyType, LogoutBodyType, RegisterBodyType, SendOTPBodyType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RolesService } from 'src/routes/auth/roles.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constants'
import { EmailService } from 'src/shared/services/email.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import { RefreshTokenBodyDTO } from 'src/routes/auth/auth.dto'
@Injectable()
export class AuthService {
  constructor(
    private readonly hashService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}
  async register(body: RegisterBodyType) {
    try {
      const verificationCode = await this.authRepository.findUniqueVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      })
      if (!verificationCode) {
        throw new UnprocessableEntityException({
          message: 'OTP is invalid',
          path: 'code',
        })
      }
      if (verificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException({
          message: 'OTP has expired',
          path: 'code',
        })
      }

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashService.hash(body.password)
      return await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId,
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
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
    if (user) {
      throw new UnprocessableEntityException({
        message: 'Email already exists',
        path: 'email',
      })
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
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })
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
}
