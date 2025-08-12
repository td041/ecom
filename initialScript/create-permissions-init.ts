import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'

const SellerModule = ['AUTH', 'PRODUCT-TRANSLATION', 'MEDIA', 'MANAGE-PRODUCT', 'PROFILE']

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3010)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router
  const permissionInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  const availableRoutes: { path: string; method: keyof typeof HTTPMethod; name: string; module: string }[] =
    router.stack
      .map((layer) => {
        if (layer.route) {
          const path = layer.route?.path
          const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
          const module = String(path.split('/')[1]).toUpperCase()

          return {
            path,
            method,
            name: method + ' ' + path,
            module,
          }
        }
      })
      .filter((item) => item !== undefined)
  const permissionInDbMap: Record<string, (typeof permissionInDb)[0]> = permissionInDb.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  }, {})
  const availableRoutesMap: Record<string, (typeof permissionInDb)[0]> = availableRoutes.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  }, {})
  // Tìm các permission có trong cơ sở dữ liệu nhưng không có trong availableRoutes
  const permissionToDelete = permissionInDb.filter((item) => {
    return !availableRoutesMap[`${item.method}-${item.path}`]
  })
  if (permissionToDelete.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionToDelete.map((item) => item.id),
        },
      },
    })
    console.log('Deleted permissions that are no longer available:', deleteResult)
  } else {
    console.log('No permissions to delete')
  }
  // Tìm các permission có trong availableRoutes nhưng không có trong cơ sở dữ liệu
  const newPermissions = availableRoutes.filter((item) => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })
  if (newPermissions.length > 0) {
    const createResult = await prisma.permission.createMany({
      data: newPermissions,
      skipDuplicates: true, // Bỏ qua các bản ghi trùng lặp
    })
    console.log('Created new permissions:', createResult.count)
  } else {
    console.log('No new permissions to create')
  }

  // Lấy lại danh sách permission sau khi đã cập nhật
  const updatedPermissions = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })
  // Cập nhật lại các permission trong Admin role
  const adminPermissionIds = updatedPermissions.map((item) => ({ id: item.id }))
  const sellerPermissionIds = updatedPermissions
    .filter((item) => SellerModule.includes(item.module))
    .map((item) => ({ id: item.id }))
  await Promise.all([updateRole(adminPermissionIds, RoleName.Admin), updateRole(sellerPermissionIds, RoleName.Seller)])
  console.log('Updated Seller role with new permissions')
  console.log('Updated Admin role with new permissions')
  process.exit(0)
}
const updateRole = async (permissionIds: { id: number }[], roleName: string) => {
  const role = await prisma.role.findFirstOrThrow({
    where: {
      name: roleName,
      deletedAt: null,
    },
  })
  await prisma.role.update({
    where: {
      id: role.id,
    },
    data: {
      permissions: {
        set: permissionIds,
      },
    },
  })
}
bootstrap()
