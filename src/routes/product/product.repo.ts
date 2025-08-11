/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common'
import {
  CreateProductBodyType,
  GetProductDetailResType,
  GetProductsQueryType,
  GetProductsResType,
} from 'src/routes/product/product.model'
import { ALL_LANGUAGE_CODE } from 'src/shared/constants/other.constants'
import { ProductType } from 'src/shared/models/shared-product.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ProductRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: GetProductsQueryType, languageId: string): Promise<GetProductsResType> {
    const { limit, page } = query
    const skip = (page - 1) * limit
    const take = limit
    const [totalItems, data] = await Promise.all([
      this.prismaService.product.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.product.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          productTranslations: {
            where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
    ])
    return {
      data,
      totalItems,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  findById(id: number, languageId: string): Promise<ProductType | null> {
    return this.prismaService.product.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        productTranslations: {
          where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
        },
        skus: {
          where: {
            deletedAt: null,
          },
        },
        brand: {
          include: {
            brandTranslations: {
              where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
            },
          },
        },
        categories: {
          where: {
            deletedAt: null,
          },
          include: {
            categoryTranslations: {
              where: languageId === ALL_LANGUAGE_CODE ? { deletedAt: null } : { languageId, deletedAt: null },
            },
          },
        },
      },
    })
  }

  create({
    createdById,
    data,
  }: {
    createdById: number
    data: CreateProductBodyType
  }): Promise<GetProductDetailResType> {
    const { skus, categories, ...productData } = data
    return this.prismaService.product.create({
      data: {
        ...productData,
        createdById,
        categories: {
          connect: categories.map((category) => ({
            id: category,
          })),
        },
        skus: {
          createMany: {
            data: skus.map((sku) => ({
              ...sku,
              createdById,
            })),
          },
        },
      },
      include: {
        productTranslations: {
          where: {
            deletedAt: null,
          },
        },
        skus: {
          where: {
            deletedAt: null,
          },
        },
        brand: {
          include: {
            brandTranslations: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
        categories: {
          where: {
            deletedAt: null,
          },
          include: {
            categoryTranslations: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })
  }

  async update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: CreateProductBodyType
  }): Promise<ProductType> {
    const { skus: dataSkus, categories, ...productData } = data
    // SKU đã tồn tại trong DB nhưng không có trong data payload thì sẽ bị xóa
    // SKU đã tồn tại trong DB nhưng có trong data payload thì sẽ được cập nhật
    // SKU không tồn tại trong DB nhưng có trong data payload thì sẽ được thêm mới

    // 1. Lấy ra các SKU đã tồn tại trong DB
    const existingSKUs = await this.prismaService.sKU.findMany({
      where: {
        productId: id,
        deletedAt: null,
      },
    })

    // 2. Tìm các SKU cần xóa
    const skusToDelete = existingSKUs.filter((sku) => dataSkus.every((dataSku) => dataSku !== sku))
    const skuIdsToDelete = skusToDelete.map((sku) => sku.id)

    // 3. Gán id(mapping id) vào trong data payload
    const skuWithId = dataSkus.map((dataSku) => {
      const existingSKU = existingSKUs.find((existingSKU) => existingSKU.value === dataSku.value)
      return {
        ...dataSku,
        id: existingSKU ? existingSKU.id : undefined,
      }
    })

    // 4. Tìm các sku để cập nhật
    const skusToUpdate = skuWithId.filter((sku) => sku.id !== null)
    // 5. Tìm các sku để thêm mới
    const skusToCreate = skuWithId
      .filter((sku) => sku.id === null)
      .map((sku) => {
        const { id: skuId, ...data } = sku
        return {
          ...data,
          productId: id,
          createdById: updatedById,
        }
      })
    const [product] = await this.prismaService.$transaction([
      // Cập nhật Product
      this.prismaService.product.update({
        where: {
          id,
        },
        data: {
          ...productData,
          updatedById,
          categories: {
            connect: categories.map((category) => ({
              id: category,
            })),
          },
        },
      }),
      // Xóa mềm các SKU không còn trong data payload
      this.prismaService.sKU.updateMany({
        where: {
          id: {
            in: skuIdsToDelete,
          },
        },
        data: {
          deletedAt: new Date(),
          deletedById: updatedById,
        },
      }),
      // Cập nhật các SKU đã tồn tại
      ...skusToUpdate.map((sku) =>
        this.prismaService.sKU.update({
          where: {
            id: sku.id,
          },
          data: {
            ...sku,
            updatedById,
          },
        }),
      ),
      // Thêm mới các SKU mới
      this.prismaService.sKU.createMany({
        data: skusToCreate,
      }),
    ])
    return product
  }

  async delete(
    {
      id,
      deletedById,
    }: {
      id: number
      deletedById: number
    },
    isHard?: boolean,
  ): Promise<ProductType> {
    if (isHard) {
      const [product] = await Promise.all([
        this.prismaService.product.delete({
          where: {
            id,
          },
        }),
        this.prismaService.sKU.deleteMany({
          where: {
            productId: id,
          },
        }),
      ])
      return product
    }
    const [product] = await Promise.all([
      this.prismaService.product.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedById,
        },
      }),
      this.prismaService.sKU.updateMany({
        where: {
          productId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedById,
        },
      }),
    ])
    return product
  }
}
