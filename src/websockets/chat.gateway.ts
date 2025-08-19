import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server
  @SubscribeMessage('send-message')
  handleEvent(@MessageBody() data: string): string {
    console.log('Received message:', data)
    this.server.emit('receive-message', {
      message: 'Message received: ' + data,
      timestamp: new Date().toISOString(),
    })
    return data
  }
}
