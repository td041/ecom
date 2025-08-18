import { SharedPaymentRepository } from './../shared/repositories/shared-payment.repo'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { CANCEL_PAYMENT_JOB_NAME, PAYMENT_QUEUE_NAME } from 'src/shared/constants/queue.constant'

@Processor(PAYMENT_QUEUE_NAME)
export class PaymentConsumer extends WorkerHost {
  constructor(private readonly sharedPaymentRepo: SharedPaymentRepository) {
    super()
  }
  async process(job: Job<{ paymentId: number }>): Promise<any> {
    switch (job.name) {
      case CANCEL_PAYMENT_JOB_NAME: {
        console.log(CANCEL_PAYMENT_JOB_NAME, job.data)
        const { paymentId } = job.data
        await this.sharedPaymentRepo.cancelPaymentAndOrder(paymentId)
        return { message: 'Payment and orders cancelled successfully' }
      }
      default: {
        break
      }
    }
  }
}
