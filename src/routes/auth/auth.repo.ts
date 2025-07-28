import { Injectable } from '@nestjs/common'
import { RegisterBodyType, UserType } from 'src/routes/auth/auth.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  async createUser(
    user: Omit<RegisterBodyType, 'confirm_password'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.PrismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }
}
