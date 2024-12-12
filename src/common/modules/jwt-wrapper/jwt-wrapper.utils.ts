import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { EnvVariablesEnum } from '../../enums/env.enum';

@Injectable()
export class JwtUtils {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    return authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;
  }

  verifyToken(
    token: string,
    ignoreExpiration = false
  ): { userId: string; token: string } | undefined {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>(EnvVariablesEnum.JWT_SECRET),
        ignoreExpiration,
      });
      return {
        userId: payload.userId,
        token,
      };
    } catch (error) {
      return undefined;
    }
  }
}
