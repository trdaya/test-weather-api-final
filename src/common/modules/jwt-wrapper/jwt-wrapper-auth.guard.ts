import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { ErrorMessageEnum } from '../../enums/error-messages.enum';
import { JwtUtils } from './jwt-wrapper.utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtUtils: JwtUtils) {}

  canActivate(context: ExecutionContext): boolean {
    const req = this.getRequest(context);
    const token = this.jwtUtils.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException(ErrorMessageEnum.INVALID_ACCESS_TOKEN);
    }

    const payload = this.jwtUtils.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException(ErrorMessageEnum.INVALID_ACCESS_TOKEN);
    }

    req.user = { id: payload.userId };
    req.token = token;

    return true;
  }

  private getRequest(context: ExecutionContext): Request {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    return gqlContext.req;
  }
}
