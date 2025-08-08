import { Injectable } from '@nestjs/common'
import { RoleName } from 'src/shared/constants/role.constants'
import { RoleType } from 'src/shared/models/shared-role.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedRoleRepository {
  private clientRoleId: number | null = null
  private adminRoleId: number | null = null

  constructor(private readonly prismaService: PrismaService) {}
  private async getRole(roleName: string) {
    console.log(roleName)
    const role: RoleType = await this.prismaService.$queryRaw`
      SELECT * from "Role" WHERE name = ${roleName} AND "deletedAt" IS NULL LIMIT 1;
    `.then((res: RoleType[]) => {
      if (res.length === 0) {
        throw new Error('Role not found')
      }
      return res[0]
    })
    return role
  }
  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId
    }
    const ClientRole = await this.getRole(RoleName.Client)

    this.clientRoleId = ClientRole.id
    return this.clientRoleId
  }
  async getAdminRoleId() {
    if (this.adminRoleId) {
      return this.adminRoleId
    }
    const AdminRole = await this.getRole(RoleName.Admin)

    this.adminRoleId = AdminRole.id
    return this.adminRoleId
  }
}
