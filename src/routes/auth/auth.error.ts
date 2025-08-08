import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'

export const InvalidOTPException = new UnprocessableEntityException({
  message: 'Error.InvalidOTP',
  path: 'code',
})

export const InvalidTOTPException = new UnprocessableEntityException({
  message: 'Error.InvalidTOTPCode',
  path: 'totpCode',
})

export const OTPExpiredException = new UnprocessableEntityException({
  message: 'Error.OTPExpired',
  path: 'code',
})

export const FailedToSendOTPException = new UnprocessableEntityException({
  message: 'Error.FailedToSendOTP',
  path: 'code',
})

export const EmailAlreadyExistsException = new UnprocessableEntityException({
  message: 'Error.EmailAlreadyExists',
  path: 'email',
})

export const EmailNotFoundException = new UnprocessableEntityException({
  message: 'Error.EmailNotFound',
  path: 'email',
})

export const TOTPAlreadyEnabledException = new UnprocessableEntityException({
  message: 'Error.TOTPAlreadyEnabled',
  path: 'totpCode',
})

export const TOTPNotEnabledException = new UnprocessableEntityException({
  message: 'Error.TOTPNotEnabled',
  path: 'totpCode',
})

export const InvalidTOTPAndCodeException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidTOTPAndCode',
    path: 'totpCode',
  },
  { message: 'Error.InvalidTOTPAndCode', path: 'code' },
])

export const RefreshTokenAlreadyUsedException = new UnauthorizedException('Error.RefreshTokenAlreadyUsed')

export const UnauthorizedAccessException = new UnauthorizedException('Error.UnauthorizedAccess')

export const GoogleUserInfoError = new Error('Error.GoogleUserInfo')
