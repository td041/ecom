import { SetMetadata } from '@nestjs/common'
import { AuthType, AuthTypeType, ConditionAuthGuard, ConditionAuthGuardType } from 'src/shared/constants/auth.constants'

export const AUTH_TYPE_KEY = 'authType'
export type AuthTypeDecoratorType = {
  authTypes: AuthTypeType[]
  options: {
    condition: ConditionAuthGuardType
  }
}
export const Auth = (
  authTypes: AuthTypeType[],
  options?: {
    condition: ConditionAuthGuardType
  },
) => {
  return SetMetadata(AUTH_TYPE_KEY, { authTypes, options: options ?? { condition: ConditionAuthGuard.And } })
}

export const IsPublic = () => Auth([AuthType.None])
