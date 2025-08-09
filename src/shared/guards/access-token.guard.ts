import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { Request } from 'express'
import { REQUEST_ROLE_PERMISSIONS, REQUEST_USER_KEY } from 'src/shared/constants/auth.constants'
import { HTTPMethod } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly TokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const decodedAccessToken = await this.extractAndValidateToken(request)
    await this.validateUserPermission(decodedAccessToken, request)
    return true
  }
  private extractAccessTokenFromHeader(request: Request): string {
    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('Error.MissingAccessToken')
    }
    return accessToken
  }
  private async extractAndValidateToken(request: Request): Promise<AccessTokenPayload> {
    const accessToken = this.extractAccessTokenFromHeader(request)
    try {
      const decodedAccessToken = await this.TokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodedAccessToken // gán key đông vào request
      return decodedAccessToken
    } catch {
      throw new UnauthorizedException('Error.InvalidAccessToken')
    }
  }
  private async validateUserPermission(decodedAccessToken: AccessTokenPayload, request: Request): Promise<void> {
    // kiểm tra quyền của user có thể truy cập vào route này không
    const roleId: number = decodedAccessToken.roleId
    const path: string = request.route.path
    const method = request.method as keyof typeof HTTPMethod
    const role = await this.prismaService.role
      .findUniqueOrThrow({
        where: {
          id: roleId,
          deletedAt: null,
        },
        include: {
          permissions: {
            where: {
              deletedAt: null,
              path,
              method,
            },
          },
        },
      })
      .catch(() => {
        throw new ForbiddenException()
      })
    // const canAccess = role.permissions.some((permission) => permission.path === path && permission.method === method)
    const canAccess = role.permissions.length > 0
    if (!canAccess) {
      throw new ForbiddenException()
    }
    request[REQUEST_ROLE_PERMISSIONS] = role
  }
}
