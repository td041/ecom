import { Injectable } from '@nestjs/common'
import { BrandRepo } from 'src/routes/brand/brand.repo'
import { CreateBrandBodyType, UpdateBrandBodyType } from 'src/routes/brand/brand.model'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { I18nContext, I18nService } from 'nestjs-i18n'
import { I18nTranslations } from 'src/generated/i18n.generated'

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepo: BrandRepo,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async list(pagination: PaginationQueryType) {
    console.log(this.i18n.t('error.NOT_FOUND', { lang: I18nContext.current()?.lang }))
    const data = await this.brandRepo.list(pagination, I18nContext.current()?.lang as string)
    return data
  }

  async findById(id: number) {
    const brand = await this.brandRepo.findById(id, I18nContext.current()?.lang as string)
    if (!brand) {
      throw NotFoundRecordException
    }
    return brand
  }

  create({ data, createdById }: { data: CreateBrandBodyType; createdById: number }) {
    return this.brandRepo.create({
      createdById,
      data,
    })
  }

  async update({ id, data, updatedById }: { id: number; data: UpdateBrandBodyType; updatedById: number }) {
    try {
      const brand = await this.brandRepo.update({
        id,
        updatedById,
        data,
      })
      return brand
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.brandRepo.delete({
        id,
        deletedById,
      })
      return {
        message: 'Delete successfully',
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw error
    }
  }
}
