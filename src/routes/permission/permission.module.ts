import { Module } from '@nestjs/common'
import { PermissionService } from '../../../../du_phong/permission.service'
import { PermissionController } from '../../../../du_phong/permission.controller'
import { PermissionRepo } from '../../../../du_phong/permission.repo'

@Module({
  providers: [PermissionService, PermissionRepo],
  controllers: [PermissionController],
})
export class PermissionModule {}
