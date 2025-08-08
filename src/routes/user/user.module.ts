import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserRepo } from 'src/routes/user/user.repo'
import { UserController } from 'src/routes/user/user.controller'

@Module({
  providers: [UserService, UserRepo],
  controllers: [UserController],
})
export class UserModule {}
