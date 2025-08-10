import { UnprocessableEntityException } from '@nestjs/common'

export const CategoryTranslationAlreadyExistsException = new UnprocessableEntityException({
  path: 'languageId',
  message: 'Error.CategoryTranslationAlreadyExists',
})

export const CategoryTranslationNotFoundException = new UnprocessableEntityException({
  message: 'Foreign key constraint failed',
  constraint: 'category_translation_languageId_fkey_or_categoryId_fkey',
})
