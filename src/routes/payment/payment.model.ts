import { z } from 'zod'

export const PaymentTransactionSchema = z.object({
  id: z.number(),
  gateway: z.string(),
  transactionDate: z.date(),
  accountNumber: z.string().nullable(),
  subAccount: z.string().nullable(),
  amountIn: z.number(),
  amountOut: z.number(),
  accumulated: z.number(),
  code: z.string().nullable(),
  transactionContent: z.string().nullable(),
  referenceNumber: z.string().nullable(),
  body: z.string().nullable(),
  createdAt: z.date(),
})

/**
 * https://docs.sepay.vn/tich-hop-webhooks.html
 */
export const WebhookPaymentBodySchema = z.object({
  id: z.number(), // ID giao dịch trên SePay
  gateway: z.string(), // Brand / tên ngân hàng
  transactionDate: z.string(), // Thời gian xảy ra giao dịch (string)
  accountNumber: z.string().nullable(), // Số tài khoản ngân hàng (có thể null)
  code: z.string().nullable(), // Mã code thanh toán (có thể null)
  content: z.string().nullable(), // Nội dung chuyển khoản (có thể null)
  transferType: z.enum(['in', 'out']), // Loại giao dịch: 'in' | 'out'
  transferAmount: z.number(), // Số tiền giao dịch
  accumulated: z.number(), // Số dư tài khoản (tích luỹ)
  subAccount: z.string().nullable(), // Tài khoản ngân phụ (có thể null)
  referenceCode: z.string().nullable(), // Mã tham chiếu (có thể null)
  description: z.string(), // Toàn bộ nội dung tin nhắn / mô tả
})

export type WebhookPaymentBodyType = z.infer<typeof WebhookPaymentBodySchema>

export type PaymentTransactionType = z.infer<typeof PaymentTransactionSchema>
