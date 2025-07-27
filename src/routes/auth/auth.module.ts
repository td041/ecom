import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from './roles.service'

@Module({
  providers: [AuthService, RolesService],
  controllers: [AuthController],
})
export class AuthModule {}
