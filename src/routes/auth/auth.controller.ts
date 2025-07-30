import { Body, Controller, Ip, Post } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  LoginBodyDTO,
  // LoginBodyDTO,
  // LoginResDTO,
  // LogoutBodyDTO,
  // LogoutResDTO,
  // RefreshTokenBodyDTO,
  // RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
  // RegisterResDTO,
} from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'
import { UserAgent } from 'src/shared/decorators/user-agent.detorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ZodSerializerDto(RegisterResDTO)
  @Post('register')
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body)
  }
  @Post('otp')
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body)
  }

  @Post('login')
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip,
    })
  }

  // @Post('refresh-token')
  // async refreshToken(@Body() body: RefreshTokenBodyDTO) {
  //   return new RefreshTokenResDTO(await this.authService.refreshToken(body.refreshToken))
  // }
  // @Post('logout')
  // async logout(@Body() body: LogoutBodyDTO) {
  //   return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  // }
}
