import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  LoginBodyDTO,
  LoginResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
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
  register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body)
  }
  @Post('otp')
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body)
  }
  @ZodSerializerDto(LoginResDTO)
  @Post('login')
  login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.login({
      ...body,
      userAgent,
      ip,
    })
  }
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RefreshTokenResDTO)
  refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.refreshToken({
      ...body,
      userAgent,
      ip,
    })
  }
  // @Post('logout')
  // async logout(@Body() body: LogoutBodyDTO) {
  //   return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  // }
}
