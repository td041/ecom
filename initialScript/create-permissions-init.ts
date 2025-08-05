import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3010)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router

  const availableRoutes = router.stack
    .map((layer) => {
      if (layer.route) {
        const path = layer.route?.path
        const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
        return {
          path,
          method,
          name: method + ' ' + path,
        }
      }
    })
    .filter((item) => item !== undefined)

  try {
    const result = await prisma.permission.createMany({
      data: availableRoutes,
      skipDuplicates: true,
    })
    console.log(result)
    console.log('Created permissions')
  } catch (error) {
    console.log(error)
  }

  console.log(availableRoutes)
  process.exit(0)
}
bootstrap()
