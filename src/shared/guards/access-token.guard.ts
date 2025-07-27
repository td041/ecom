import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constants'
import { TokenService } from 'src/shared/services/token.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly TokenService: TokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const accessToken = request.headers['authorization']?.split(' ')[1] // Assuming Bearer token format
    // console.log('accessToken', accessToken)
    if (!accessToken) {
      throw new UnauthorizedException()
    }
    try {
      const decodedAccessToken = await this.TokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken // gán key đông vào request
      return true
    } catch (error) {
      console.log(error)
        throw new UnauthorizedException()
    }
  }
}
