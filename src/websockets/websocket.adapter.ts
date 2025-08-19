import { IoAdapter } from '@nestjs/platform-socket.io'
import { Server, ServerOptions } from 'socket.io'

export class WebSocketAdapter extends IoAdapter {
  createIOServer(port?: number, options?: ServerOptions) {
    const server: Server = super.createIOServer(3003, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    })
    const authMiddleware = (socket: any, next: (err?: any) => void) => {
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
      })
      next()
    }
    server.use(authMiddleware)
    server.of('/.*/').use(authMiddleware)

    return server
  }
}
