import { Module } from '@nestjs/common'
import { ChatGateway } from './chat.gateway'

@Module({
  imports: [ChatGateway],
})
export class WebSocketModule {}
