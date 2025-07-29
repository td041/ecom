import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'
import { OTPEmail } from 'emails/otp'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }
  sendOTP(payload: { email: string; code: string }) {
    const subject = 'Your OTP code'
    const aIndex = payload.email.indexOf('@')
    return this.resend.emails.send({
      from: 'Ecommerce Nestjs<no-reply@resend.dev>',
      to: ['trinhtrantrungduc@gmail.com'],
      subject,
      react: OTPEmail({ otpCode: payload.code, title: subject, userEmail: payload.email.slice(0, aIndex) }),
    })
  }
}
