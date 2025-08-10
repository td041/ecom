import { UnprocessableEntityException } from '@nestjs/common'

export const BrandTranslationAlreadyExistsException = new UnprocessableEntityException([
  {
    path: 'languageId',
    message: 'Error.BrandTranslationAlreadyExists',
  },
])
export const BrandTranslationNotFoundException = new UnprocessableEntityException({
  message: 'Foreign key constraint failed',
  constraint: 'brand_translation_languageId_fkey_or_brandId_fkey',
})
