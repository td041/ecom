import { Module } from '@nestjs/common'
import { ChatGateway } from './chat.gateway'
import { PaymentGateway } from './payment.gateway'

@Module({
  imports: [ChatGateway, PaymentGateway],
})
export class WebSocketModule {}
