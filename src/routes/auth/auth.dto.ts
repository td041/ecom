import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const RegisterBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    name: z.string().min(1).max(100),
    confirm_password: z.string().min(6).max(100),
    phoneNumber: z.string().min(10).max(15),
  })
  .strict()
  .superRefine(({ password, confirm_password }, ctx) => {
    if (password !== confirm_password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirm_password'],
      })
    }
  })
export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
