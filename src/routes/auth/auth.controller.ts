import { Body, Controller, Post } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
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

  // @Post('login')
  // async login(@Body() body: LoginBodyDTO) {
  //   return new LoginResDTO(await this.authService.login(body))
  // }

  // @Post('refresh-token')
  // async refreshToken(@Body() body: RefreshTokenBodyDTO) {
  //   return new RefreshTokenResDTO(await this.authService.refreshToken(body.refreshToken))
  // }
  // @Post('logout')
  // async logout(@Body() body: LogoutBodyDTO) {
  //   return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  // }
}
