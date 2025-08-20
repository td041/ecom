import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { WebSocketAdapter } from 'src/websockets/websocket.adapter'
import { patchNestJsSwagger } from 'nestjs-zod'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()
  patchNestJsSwagger()
  const config = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('The ecommerce API description')
    .setVersion('1.0')
    .addTag('ecommerce')
    .addBearerAuth()
    .addApiKey(
      {
        name: 'authorization',
        type: 'apiKey',
      },
      'payment-api-key',
    )
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const websocketAdapter = new WebSocketAdapter(app)
  await websocketAdapter.connectToRedis()
  app.useWebSocketAdapter(websocketAdapter)

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
