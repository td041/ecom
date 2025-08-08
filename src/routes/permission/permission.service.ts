import { Injectable } from '@nestjs/common'
import { PermissionRepo } from 'src/routes/permission/permission.repo'
import {
  CreatePermissionBodyType,
  GetPermissionsQueryType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { PermissionAlreadyExistsException } from 'src/routes/permission/permission.error'

@Injectable()
export class PermissionService {
  constructor(private permissionRepo: PermissionRepo) {}

  async list(pagination: GetPermissionsQueryType) {
    const data = await this.permissionRepo.list(pagination)
    return data
  }

  async findById(id: number) {
    const permission = await this.permissionRepo.findById(id)
    if (!permission) {
      throw NotFoundRecordException
    }
    return permission
  }

  async create({ body, createdById }: { body: CreatePermissionBodyType; createdById: number }) {
    try {
      return await this.permissionRepo.create({
        createdById,
        body,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      throw error
    }
  }
  async update({ id, body, updatedById }: { id: number; body: UpdatePermissionBodyType; updatedById: number }) {
    try {
      return await this.permissionRepo.update({ id, body, updatedById })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      throw error
    }
  }
  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.permissionRepo.delete({ id, deletedById })
      return {
        message: 'Delete successfully.',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}
