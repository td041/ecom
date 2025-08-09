import { Injectable } from '@nestjs/common'
import { DeviceType, RefreshTokenType, VerificationCodeType } from 'src/routes/auth/auth.model'
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constants'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { WhereUniqueUserType } from 'src/shared/repositories/shared-user.repo'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  createUser(
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
  createUserIncludeRole(
    user: Pick<UserType, 'roleId' | 'email' | 'password' | 'phoneNumber' | 'name' | 'avatar'>,
  ): Promise<UserType & { role: RoleType }> {
    return this.PrismaService.user.create({
      data: user,

      include: {
        role: true,
      },
    })
  }

  createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    return this.PrismaService.verificationCode.upsert({
      where: {
        email_code_type: {
          email: payload.email,
          code: payload.code,
          type: payload.type,
        },
      },
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
      create: payload,
    })
  }
  findUniqueVerificationCode(
    uniqueValue:
      | { id: number }
      | { email_code_type: { email: string; code: string; type: TypeOfVerificationCodeType } },
  ): Promise<VerificationCodeType | null> {
    return this.PrismaService.verificationCode.findUnique({
      where: uniqueValue,
    })
  }
  createRefreshToken(data: { token: string; userId: number; expiresAt: Date; deviceId: number }) {
    return this.PrismaService.refreshToken.create({
      data,
    })
  }
  createDevice(data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & { lastActive?: Date; isActive?: boolean }) {
    return this.PrismaService.device.create({
      data,
    })
  }
  findUniqueUserIncludeRole(where: WhereUniqueUserType): Promise<(UserType & { role: RoleType }) | null> {
    return this.PrismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    })
  }
  findUniqueRefreshTokenIncludeUserRole(uniqueValue: {
    token: string
  }): Promise<RefreshTokenType & { user: UserType & { role: RoleType } }> {
    return this.PrismaService.refreshToken.findUniqueOrThrow({
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
  deleteRefreshToken(data: { token: string }): Promise<RefreshTokenType> {
    return this.PrismaService.refreshToken.delete({
      where: data,
    })
  }
  deviceUpdate(deviceId: number, data: Partial<DeviceType>): Promise<DeviceType> {
    return this.PrismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    })
  }
  deleteVerificationCode(
    uniqueValue:
      | { id: number }
      | { email_code_type: { email: string; code: string; type: TypeOfVerificationCodeType } },
  ): Promise<VerificationCodeType> {
    return this.PrismaService.verificationCode.delete({ where: uniqueValue })
  }
}
