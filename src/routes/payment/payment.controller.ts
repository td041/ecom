import { Controller, Post, Body } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { WebhookPaymentBodyDTO } from 'src/routes/payment/payment.dto'
import { Auth } from 'src/shared/decorators/auth.decorator'

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/receiver')
  @ZodSerializerDto(MessageResDTO)
  @Auth(['PaymentAPIKey'])
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body)
  }
}
