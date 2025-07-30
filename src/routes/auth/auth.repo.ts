import { Injectable } from '@nestjs/common'
import { DeviceType, RegisterBodyType, RoleType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constants'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  async createUser(
    user: Omit<RegisterBodyType, 'confirm_password' | 'code'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.PrismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }
  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    return this.PrismaService.verificationCode.upsert({
      where: {
        email: payload.email,
      },
      create: payload,
      update: {
        code: payload.code,
        createdAt: new Date(),
        expiresAt: payload.expiresAt,
      },
    })
  }
  async findUniqueVerificationCode(
    uniqueValue: { email: string } | { id: number } | { email: string; code: string; type: TypeOfVerificationCode },
  ): Promise<VerificationCodeType | null> {
    return this.PrismaService.verificationCode.findUnique({
      where: uniqueValue,
    })
  }
  async createRefreshToken(data: { token: string; userId: number; expiresAt: Date; deviceId: number }) {
    return this.PrismaService.refreshToken.create({
      data,
    })
  }
  async createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & { lastActive?: Date; isActive?: boolean },
  ) {
    return this.PrismaService.device.create({
      data,
    })
  }
  async findUniqueUserIncludeRole(
    uniqueObject: { email: string } | { id: number },
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.PrismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: true,
      },
    })
  }
}
