import { Module } from '@nestjs/common'
import { OrderController } from 'src/routes/order/order.controller'
import { OrderRepo } from 'src/routes/order/order.repo'
import { OrderService } from 'src/routes/order/order.service'

@Module({
  providers: [OrderService, OrderRepo],
  controllers: [OrderController],
})
export class OrderModule {}
