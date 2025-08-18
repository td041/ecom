import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import { generateCancelPaymentJobId } from 'src/shared/helpers'

Injectable()
export class PaymentProducer {
  constructor(@InjectQueue('payment') private paymentQueue: Queue) {}

  removeJob(paymentId: number) {
    return this.paymentQueue.remove(generateCancelPaymentJobId(paymentId))
  }
}
