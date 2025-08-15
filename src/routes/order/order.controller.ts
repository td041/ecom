import { Controller, Get, Query } from '@nestjs/common'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { OrderService } from 'src/routes/order/order.service'
import { GetOrderListQueryDTO } from 'src/routes/order/order.dto'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ZodSerializerDto(GetOrderListQueryDTO)
  getOrder(@ActiveUser('userId') userId: number, @Query() query: GetOrderListQueryDTO) {
    return this.orderService.list(userId, query)
  }
}
