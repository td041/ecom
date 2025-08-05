import { Injectable } from '@nestjs/common'
import {
  CreatePermissionBodyType,
  GetPermissionsQueryType,
  GetPermissionsResType,
  PermissionType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class PermissionRepo {
  constructor(private prismaService: PrismaService) {}

  async list(pagination: GetPermissionsQueryType): Promise<GetPermissionsResType> {
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit
    const [totalItems, data] = await Promise.all([
      this.prismaService.permission.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.permission.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take,
      }),
    ])
    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    }
  }

  findById(id: number): Promise<PermissionType | null> {
    return this.prismaService.permission.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })
  }

  create({
    createdById,
    body,
  }: {
    createdById: number | null
    body: CreatePermissionBodyType
  }): Promise<PermissionType> {
    return this.prismaService.permission.create({
      data: {
        ...body,
        createdById,
      },
    })
  }
  update({
    id,
    body,
    updatedById,
  }: {
    id: number
    body: UpdatePermissionBodyType
    updatedById: number
  }): Promise<PermissionType> {
    return this.prismaService.permission.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...body,
        updatedById,
      },
    })
  }
  delete({ id, deletedById }: { id: number; deletedById: number }, isHard?: boolean): Promise<PermissionType> {
    return isHard
      ? this.prismaService.permission.delete({
          where: { id },
        })
      : this.prismaService.permission.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        })
  }
}
