import { Injectable } from '@nestjs/common'
import { DeviceType, RefreshTokenType, RoleType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constants'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  async createUser(
    user: Pick<UserType, 'roleId' | 'email' | 'password' | 'phoneNumber' | 'name'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.PrismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }
  async createUserIncludeRole(
    user: Pick<UserType, 'roleId' | 'email' | 'password' | 'phoneNumber' | 'name' | 'avatar'>,
  ): Promise<UserType & { role: RoleType }> {
    return this.PrismaService.user.create({
      data: user,

      include: {
        role: true,
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
        type: payload.type,
        createdAt: new Date(),
        expiresAt: payload.expiresAt,
      },
    })
  }
  async findUniqueVerificationCode(
    uniqueValue: { email: string } | { id: number } | { email: string; code: string; type: TypeOfVerificationCodeType },
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
  async findUniqueRefreshTokenIncludeUserRole(uniqueValue: {
    token: string
  }): Promise<RefreshTokenType & { user: UserType & { role: RoleType } }> {
    return await this.PrismaService.refreshToken.findUniqueOrThrow({
      where: uniqueValue,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    })
  }
  async deleteRefreshToken(data: { token: string }): Promise<RefreshTokenType> {
    return await this.PrismaService.refreshToken.delete({
      where: data,
    })
  }
  async deviceUpdate(deviceId: number, data: Partial<DeviceType>): Promise<DeviceType> {
    return await this.PrismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    })
  }
  async updateUser(where: { id: number } | { email: string }, data: Partial<Omit<UserType, 'id'>>): Promise<UserType> {
    return await this.PrismaService.user.update({
      where,
      data,
    })
  }
  async deleteVerificationCode(
    uniqueValue: { email: string } | { id: number } | { email: string; code: string; type: TypeOfVerificationCodeType },
  ): Promise<VerificationCodeType> {
    return this.PrismaService.verificationCode.delete({ where: uniqueValue })
  }
}
