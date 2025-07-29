import { Injectable } from '@nestjs/common'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedUserRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  async findUnique(uniqueObject: { email: string } | { id: number }): Promise<UserType | null> {
    return this.PrismaService.user.findUnique({
      where: uniqueObject,
    })
  }
}
