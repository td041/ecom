import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { REQUEST_ROLE_PERMISSIONS } from 'src/shared/constants/auth.constants'
import { RolePermissionType } from 'src/shared/models/shared-role.model'

export const ActiveUser = createParamDecorator(
  (field: keyof RolePermissionType | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const rolePermissions: RolePermissionType | undefined = request[REQUEST_ROLE_PERMISSIONS]
    return field ? rolePermissions?.[field] : rolePermissions
  },
)
