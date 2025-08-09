import { Injectable } from '@nestjs/common'
import { PermissionType } from 'src/shared/models/shared-permission.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

type UserIncludeRolePermissionsType = UserType & { role: RoleType & { permissions: PermissionType[] } }

export type WhereUniqueUserType = { id: number } | { email: string }
@Injectable()
export class SharedUserRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  async findUnique(where: WhereUniqueUserType): Promise<UserType | null> {
    return this.PrismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
    })
  }
  findUniqueIncludeRolePermissions(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionsType | null> {
    return this.PrismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })
  }
  update(where: { id: number }, data: Partial<UserType>): Promise<UserType | null> {
    return this.PrismaService.user.update({
      where: {
        ...where,
        deletedAt: null,
      },
      data,
    })
  }
}
