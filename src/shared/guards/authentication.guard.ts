import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthType, ConditionAuthGuard } from 'src/shared/constants/auth.constants'
import { AUTH_TYPE_KEY, AuthTypeDecoratorType } from 'src/shared/decorators/auth.decorator'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { PaymentAPIKeyGuard } from 'src/shared/guards/payment-api-key.guard'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly paymentApiKeyGuard: PaymentAPIKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.PaymentAPIKey]: this.paymentApiKeyGuard,
      [AuthType.None]: { canActivate: () => true }, // No authentication required
    }
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.getAuthTypeValue(context)
    const guards = authTypeValue.authTypes.map((authType) => this.authTypeGuardMap[authType])
    return authTypeValue.options.condition === ConditionAuthGuard.Or
      ? this.handleOrCondition(guards, context)
      : this.handleAndCondition(guards, context)
  }

  private getAuthTypeValue(context: ExecutionContext): AuthTypeDecoratorType {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecoratorType | undefined>(AUTH_TYPE_KEY, [
      context.getHandler(),
      // Lấy từ metadata gần cấp với handler nhất
      context.getClass(),
      // Lấy từ metadata gần cấp với class Controller nhất
    ]) ?? { authTypes: [AuthType.Bearer], options: { condition: ConditionAuthGuard.And } }
    // console.log('authTypeValue', authTypeValue)
    return authTypeValue
  }
  private async handleOrCondition(guards: CanActivate[], context: ExecutionContext): Promise<boolean> {
    let lastError: any = null
    for (const guard of guards) {
      try {
        if (await guard.canActivate(context)) {
          return true
        }
      } catch (error) {
        lastError = error
      }
    }
    if (lastError instanceof HttpException) {
      throw lastError
    }
    throw new UnauthorizedException()
  }
  private async handleAndCondition(guards: CanActivate[], context: ExecutionContext): Promise<boolean> {
    for (const guard of guards) {
      try {
        if (!(await guard.canActivate(context))) {
          throw new UnauthorizedException()
        }
      } catch (error) {
        if (error instanceof HttpException) {
          throw error
        }
        throw new UnauthorizedException()
      }
    }
    return true
  }
}
