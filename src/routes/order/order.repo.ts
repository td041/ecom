import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  NotFoundCartItemException,
  OrderNotFoundException,
  OutOfStockSKUException,
  ProductNotFoundException,
  SKUNotBelongToShopException,
} from 'src/routes/order/order.error'
import {
  CancelOrderResType,
  CreateOrderBodyType,
  CreateOrderResType,
  GetOrderDetailResType,
  GetOrderListQueryType,
  GetOrderListResType,
} from 'src/routes/order/order.model'
import { OrderStatus } from 'src/shared/constants/order.constants'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class OrderRepo {
  constructor(private readonly prismaService: PrismaService) {}
  async list(userId: number, query: GetOrderListQueryType): Promise<GetOrderListResType> {
    const { limit, page, status } = query
    const skip = (page - 1) * limit
    const take = limit
    const where: Prisma.OrderWhereInput = {
      userId,
      status,
    }
    const totalItem$ = this.prismaService.order.count({
      where,
    })
    const data$ = this.prismaService.order.findMany({
      where,
      include: {
        items: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    })
    const [totalItems, data] = await Promise.all([totalItem$, data$])
    return {
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }
  async create(userId: number, body: CreateOrderBodyType): Promise<CreateOrderResType> {
    const allBodyCartItemIds = body.map((item) => item.cartItemIds).flat()
    // từ orders => cartItemIds => cartItems => cartItem
    const cartItems = await this.prismaService.cartItem.findMany({
      where: {
        id: {
          in: allBodyCartItemIds,
        },
        userId,
      },
      include: {
        sku: {
          include: {
            product: {
              include: {
                productTranslations: true,
              },
            },
          },
        },
      },
    })
    // 1. Kiểm tra xem tất cả cartItemIds có tồn tại trong csdl hay không
    if (cartItems.length !== allBodyCartItemIds.length) {
      throw NotFoundCartItemException
    }
    // 2. Kiểm tra số lượng mua có lớn hơn số lượng tồn kho hay không
    const isOutOfStock = cartItems.some((item) => item.quantity > item.sku.stock)
    if (isOutOfStock) {
      throw OutOfStockSKUException
    }
    // 3. Kiểm tra xem tất cả sản phẩm mua có sản phẩm nào bị xóa hay bị ẩn hay không
    const isExistNotReadyProduct = cartItems.some(
      (item) =>
        item.sku.product.deletedAt !== null ||
        item.sku.product.publishedAt === null ||
        item.sku.product.publishedAt > new Date(),
    )
    if (isExistNotReadyProduct) {
      throw ProductNotFoundException
    }
    // 4. Kiểm tra xem các sản phẩm skuId trong cartItem gửi lên có thuộc về ShopId gửi lên hay không
    const cartItemMap = new Map<number, (typeof cartItems)[0]>()
    // lưu dữ liệu cartItems vừa tìm từ trong DB vào đây để so sánh với dữ liệu mà client truyền lên

    cartItems.forEach((item) => cartItemMap.set(item.id, item))
    const isValidShop = body.every((item) => {
      const bodyCartItemIds = item.cartItemIds
      return bodyCartItemIds.every((id) => {
        // nếu đã đến bước này thì cartItem luôn có giá trị
        // vì chúng ta đã so sánh với allBodyCartItemIds.length ở trên rồi
        const cartItem = cartItemMap.get(id)!
        return (item.shopId = cartItem.sku.createdById)
      })
    })
    if (!isValidShop) {
      throw SKUNotBelongToShopException
    }
    // 5. Tạo order và xóa cartItem trong transaction để bảo đảm tính toàn vẹn dữ liệu
    const orders = await this.prismaService.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          status: PaymentStatus.PENDING,
        },
      })
      const orders$ = await Promise.all(
        body.map((item) =>
          tx.order.create({
            data: {
              userId,
              paymentId: payment.id,
              status: OrderStatus.PENDING_PAYMENT,
              receiver: item.receiver,
              shopId: item.shopId,
              createdById: userId,
              items: {
                create: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemMap.get(cartItemId)!
                  return {
                    productName: cartItem.sku.product.name,
                    skuPrice: cartItem?.sku.price,
                    quantity: cartItem?.quantity,
                    image: cartItem?.sku.image,
                    skuValue: cartItem?.sku.value,
                    productId: cartItem.sku.product.id,
                    productTranslations: cartItem?.sku.product.productTranslations.map((translation) => ({
                      id: translation.id,
                      name: translation.name,
                      description: translation.description,
                      languageId: translation.languageId,
                    })),
                  }
                }),
              },
              products: {
                connect: item.cartItemIds.map((cartItemId) => {
                  const cartItem = cartItemMap.get(cartItemId)!
                  return {
                    id: cartItem.id,
                  }
                }),
              },
            },
          }),
        ),
      )
      const cartItem$ = await tx.cartItem.deleteMany({
        where: {
          id: {
            in: allBodyCartItemIds,
          },
        },
      })
      const sku$ = Promise.all(
        cartItems.map((item) =>
          tx.sKU.update({
            where: {
              id: item.sku.id,
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          }),
        ),
      )
      const [orders] = await Promise.all([orders$, cartItem$, sku$])
      return orders
    })
    return {
      data: orders,
    }
  }
  async detail(userId: number, orderId: number): Promise<GetOrderDetailResType> {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: orderId,
        userId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    })
    if (!order) {
      throw OrderNotFoundException
    }
    return order
  }
  async cancel(userId: number, orderId: number): Promise<CancelOrderResType> {
    try {
      const order = await this.prismaService.order.update({
        where: {
          id: orderId,
          userId,
          deletedAt: null,
        },
        data: {
          status: OrderStatus.CANCELLED,
          updatedById: userId,
        },
      })
      return order
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw OrderNotFoundException
      }
      throw error
    }
  }
}
