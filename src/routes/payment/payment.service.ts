import { Injectable } from '@nestjs/common'
import { PaymentRepo } from 'src/routes/payment/payment.repo'
import { WebhookPaymentBodyType } from 'src/routes/payment/payment.model'
import { SharedWebSocketRepository } from 'src/shared/repositories/shared-websocket.repo'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
import { generateRoomUserId } from 'src/shared/helpers'

@Injectable()
@WebSocketGateway({ namespace: 'payment' })
export class PaymentService {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly sharedWebsocketRepo: SharedWebSocketRepository,
  ) {}

  async receiver(body: WebhookPaymentBodyType) {
    const userId = await this.paymentRepo.receiver(body)
    this.server.to(generateRoomUserId(userId)).emit('payment', { status: 'success' })
    // try {
    //   const websockets = await this.sharedWebsocketRepo.findMany(userId)
    //   websockets.forEach((ws) => {
    //     this.server.to(ws.id).emit('payment', { status: 'success' })
    //   })
    // } catch (error) {
    //   console.error('Error occurred while processing payment:', error)
    // }
    return {
      message: 'Payment received successfully',
    }
  }
}
