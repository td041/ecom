import { Injectable } from '@nestjs/common'
import { CreateOrderBodyType, GetOrderListQueryType } from 'src/routes/order/order.model'
import { OrderRepo } from 'src/routes/order/order.repo'

@Injectable()
export class OrderService {
  constructor(private readonly orderRepo: OrderRepo) {}

  async list(userId: number, query: GetOrderListQueryType) {
    return await this.orderRepo.list(userId, query)
  }
  async create(userId: number, body: CreateOrderBodyType) {
    try {
      return await this.orderRepo.create(userId, body)
    } catch (error) {
      console.log(error)
    }
  }
  async cancel(userId: number, orderId: number) {
    return await this.orderRepo.cancel(userId, orderId)
  }
  async detail(userId: number, orderId: number){
    return await this.orderRepo.detail(userId, orderId)
  }
}
