import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import { RegisterBodyType, SendOTPBodyType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RolesService } from 'src/routes/auth/roles.service'
import { generateOTP, isUniqueConstraintError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constants'
import { EmailService } from 'src/shared/services/email.service'
@Injectable()
export class AuthService {
  constructor(
    private readonly hashService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
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
    const verificationCode = await this.authRepository.createVerificationCode({
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
    return verificationCode
  }
  // async login(body: LoginBodyDTO) {
  //   const user = await this.PrismaService.user.findUnique({
  //     where: {
  //       email: body.email,
  //     },
  //   })
  //   if (!user) {
  //     // không tìm thấy tài khoản
  //     throw new UnauthorizedException('Account is not exist')
  //   }
  //   const isPasswordMatch = await this.HashService.compare(body.password, user.password)
  //   if (!isPasswordMatch) {
  //     // mật khẩu không đúng
  //     throw new UnprocessableEntityException([
  //       {
  //         field: 'password',
  //         error: 'Password is incorrect',
  //       },
  //     ])
  //   }
  //   const tokens = this.generateTokens({ userId: user.id })
  //   return tokens
  // }

  // async generateTokens(payload: { userId: number }) {
  //   const [accessToken, refreshToken] = await Promise.all([
  //     this.TokenService.signAccessToken(payload),
  //     this.TokenService.signRefreshToken(payload),
  //   ])
  //   const decodedRefreshToken = await this.TokenService.verifyRefreshToken(refreshToken)
  //   await this.PrismaService.refreshToken.create({
  //     data: {
  //       token: refreshToken,
  //       userId: decodedRefreshToken.userId,
  //       expiresAt: new Date(decodedRefreshToken.exp * 1000),
  //     },
  //   })
  //   return { accessToken, refreshToken }
  // }
  // async refreshToken(refreshToken: string) {
  //   try {
  //     // 1. Kiểm tra xem refresh token có hợp lệ không
  //     const decodedRefreshToken = await this.TokenService.verifyRefreshToken(refreshToken)
  //     // 2. Kiểm tra xem refresh token có tồn tại trong cơ sở dữ liệu không
  //     await this.PrismaService.refreshToken.findFirstOrThrow({
  //       // check revoked token
  //       // throw mã lỗi 'P2025'
  //       where: {
  //         token: refreshToken,
  //       },
  //     })
  //     // 3. Xóa refreshToken cũ
  //     await this.PrismaService.refreshToken.delete({
  //       // revoke sau khi dùng
  //       where: {
  //         token: refreshToken,
  //       },
  //     })
  //     // 4. Tạo mới accessToken và refreshToken
  //     return await this.generateTokens({ userId: decodedRefreshToken.userId })
  //   } catch (error) {
  //     if (isNotFoundPrismaError(error)) {
  //       throw new UnauthorizedException('Refresh token has been revoked')
  //     }
  //     throw new UnauthorizedException()
  //   }
  // }
  // async logout(refreshToken: string) {
  //   try {
  //     // 1. Kiểm tra xem refresh token có hợp lệ không
  //     await this.TokenService.verifyRefreshToken(refreshToken)
  //     // 2. Kiểm tra xem refresh token có tồn tại trong cơ sở dữ liệu không
  //     await this.PrismaService.refreshToken.delete({
  //       // check revoked token
  //       // throw mã lỗi 'P2025'
  //       where: {
  //         token: refreshToken,
  //       },
  //     })

  //     return { message: 'Logout successfully' }
  //   } catch (error) {
  //     if (isNotFoundPrismaError(error)) {
  //       throw new UnauthorizedException('Refresh token has been revoked')
  //     }
  //     throw new UnauthorizedException()
  //   }
  // }
}
