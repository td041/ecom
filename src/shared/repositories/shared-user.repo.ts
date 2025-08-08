import { Injectable } from '@nestjs/common'
import { PermissionType } from 'src/shared/models/shared-permission.model'
import { RoleType } from 'src/shared/models/shared-role.model'
import { UserType } from 'src/shared/models/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

type UserIncludeRolePermissionsType = UserType & { role: RoleType & { permissions: PermissionType[] } }

export type WhereUniqueUserType = { id: number; [key: string]: any } | { email: string; [key: string]: any }
@Injectable()
export class SharedUserRepository {
  constructor(private readonly PrismaService: PrismaService) {}
  async findUnique(uniqueObject: WhereUniqueUserType): Promise<UserType | null> {
    return this.PrismaService.user.findUnique({
      where: uniqueObject,
    })
  }
  findUniqueIncludeRolePermissions(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionsType | null> {
    return this.PrismaService.user.findUnique({
      where,
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
  update(where: WhereUniqueUserType, data: Partial<UserType>): Promise<UserType | null> {
    return this.PrismaService.user.update({
      where,
      data,
    })
  }
}
