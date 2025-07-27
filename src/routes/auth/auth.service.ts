import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { LoginBodyDTO, RegisterBodyDTO } from 'src/routes/auth/auth.dto'
import { RolesService } from 'src/routes/auth/roles.service'
import { isNotFoundPrismaError, isUniqueConstraintError } from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly HashService: HashingService,
    private readonly PrismaService: PrismaService,
    private readonly TokenService: TokenService,
    private readonly RolesService: RolesService,
  ) {}
  async register(body: RegisterBodyDTO) {
    try {
      const clientRoleId = await this.RolesService.getClientRoleId()
      const hashedPassword = await this.HashService.hash(body.password)
      const user = await this.PrismaService.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
        },
      })
      return user
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Email already exists')
      }
      throw error
    }
  }

  async login(body: LoginBodyDTO) {
    const user = await this.PrismaService.user.findUnique({
      where: {
        email: body.email,
      },
    })
    if (!user) {
      // không tìm thấy tài khoản
      throw new UnauthorizedException('Account is not exist')
    }
    const isPasswordMatch = await this.HashService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      // mật khẩu không đúng
      throw new UnprocessableEntityException([
        {
          field: 'password',
          error: 'Password is incorrect',
        },
      ])
    }
    const tokens = this.generateTokens({ userId: user.id })
    return tokens
  }

  async generateTokens(payload: { userId: number }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.TokenService.signAccessToken(payload),
      this.TokenService.signRefreshToken(payload),
    ])
    const decodedRefreshToken = await this.TokenService.verifyRefreshToken(refreshToken)
    await this.PrismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: decodedRefreshToken.userId,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    })
    return { accessToken, refreshToken }
  }
  async refreshToken(refreshToken: string) {
    try {
      // 1. Kiểm tra xem refresh token có hợp lệ không
      const decodedRefreshToken = await this.TokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra xem refresh token có tồn tại trong cơ sở dữ liệu không
      await this.PrismaService.refreshToken.findFirstOrThrow({
        // check revoked token
        // throw mã lỗi 'P2025'
        where: {
          token: refreshToken,
        },
      })
      // 3. Xóa refreshToken cũ
      await this.PrismaService.refreshToken.delete({
        // revoke sau khi dùng
        where: {
          token: refreshToken,
        },
      })
      // 4. Tạo mới accessToken và refreshToken
      return await this.generateTokens({ userId: decodedRefreshToken.userId })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      throw new UnauthorizedException()
    }
  }
  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra xem refresh token có hợp lệ không
      await this.TokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra xem refresh token có tồn tại trong cơ sở dữ liệu không
      await this.PrismaService.refreshToken.delete({
        // check revoked token
        // throw mã lỗi 'P2025'
        where: {
          token: refreshToken,
        },
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
