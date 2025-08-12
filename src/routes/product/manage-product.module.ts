import { Module } from '@nestjs/common'
import { ManageProductController } from 'src/routes/product/manage-product.controller'
import { ManageProductService } from 'src/routes/product/manage-product.service'
import { ProductRepo } from 'src/routes/product/product.repo'

@Module({
  providers: [ManageProductService, ProductRepo],
  controllers: [ManageProductController],
})
export class ManageProductModule {}
