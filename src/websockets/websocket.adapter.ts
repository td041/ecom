import { INestApplicationContext } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { Server, ServerOptions, Socket } from 'socket.io'
import envConfig from 'src/shared/config'
import { generateRoomUserId } from 'src/shared/helpers'
import { SharedWebSocketRepository } from 'src/shared/repositories/shared-websocket.repo'
import { TokenService } from 'src/shared/services/token.service'

export class WebSocketAdapter extends IoAdapter {
  private readonly sharedWebsocketRepositoy: SharedWebSocketRepository
  private readonly tokenService: TokenService
  private adapterConstructor: ReturnType<typeof createAdapter>
  constructor(app: INestApplicationContext) {
    super(app)
    this.sharedWebsocketRepositoy = app.get(SharedWebSocketRepository)
    this.tokenService = app.get(TokenService)
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: envConfig.REDIS_URL })
    const subClient = pubClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port?: number, options?: ServerOptions) {
    const server: Server = super.createIOServer(3003, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    })

    server.use((socket, next) => {
      this.authMiddleware(socket, next)
    })
    server.of(/.*/).use((socket, next) => {
      this.authMiddleware(socket, next)
    })

    return server
  }
  authMiddleware = async (socket: Socket, next: (err?: any) => void) => {
    const { authorization } = socket.handshake.headers
    console.log(`Authorization header: ${authorization}`)
    if (!authorization) {
      return next(new Error('Missing authorization header'))
    }
    const accessToken = authorization.split(' ')[1]
    try {
      const { userId } = await this.tokenService.verifyAccessToken(accessToken)
      await socket.join(generateRoomUserId(userId))
      // await this.sharedWebsocketRepositoy.create({
      //   id: socket.id,
      //   userId,
      // })
      // console.log(`Client connected: ${socket.id}`)
      // socket.on('disconnect', async () => {
      //   await this.sharedWebsocketRepositoy.delete(socket.id).catch(() => {})
      // })
    } catch (error) {
      next(error)
    }
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
    next()
  }
}
