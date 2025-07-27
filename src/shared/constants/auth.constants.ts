export const REQUEST_USER_KEY = 'user'

export const AuthType = {
  Bearer: 'Bearer',
  None: 'None',
  APIKey: 'APIKey',
} as const

export type AuthTypeType = (typeof AuthType)[keyof typeof AuthType]

export const ConditionAuthGuard = {
  And: 'And',
  Or: 'Or',
} as const 

export type ConditionAuthGuardType = (typeof ConditionAuthGuard)[keyof typeof ConditionAuthGuard]
