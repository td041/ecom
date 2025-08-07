import { NotFoundException } from '@nestjs/common'

export const NotFoundRecordException = new NotFoundException('Error.NotFound')
export const InvalidPasswordException = new NotFoundException('Error.InvalidPassword')
