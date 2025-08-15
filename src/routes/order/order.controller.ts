import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { OrderService } from 'src/routes/order/order.service'
import {
  CreateOrderBodyDTO,
  CreateOrderResDTO,
  GetOrderDetailResDTO,
  GetOrderListQueryDTO,
  GetOrderParamsDTO,
} from 'src/routes/order/order.dto'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ZodSerializerDto(GetOrderListQueryDTO)
  getOrder(@ActiveUser('userId') userId: number, @Query() query: GetOrderListQueryDTO) {
    return this.orderService.list(userId, query)
  }

  @Post()
  @ZodSerializerDto(CreateOrderResDTO)
  create(@ActiveUser('userId') userId: number, @Body() body: CreateOrderBodyDTO) {
    return this.orderService.create(userId, body)
  }

  @Get()
  @ZodSerializerDto(GetOrderDetailResDTO)
  detail(@ActiveUser('userId') userId: number, @Param() param: GetOrderParamsDTO) {
    return this.orderService.detail(userId, param.orderId)
  }

  @Put(':orderId')
  @ZodSerializerDto(GetOrderDetailResDTO)
  cancel(@ActiveUser('userId') userId: number, @Param() param: GetOrderParamsDTO) {
    return this.orderService.detail(userId, param.orderId)
  }
}
