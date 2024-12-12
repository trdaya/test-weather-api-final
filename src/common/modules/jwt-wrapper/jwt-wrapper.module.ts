import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtUtils } from './jwt-wrapper.utils';
import { EnvVariablesEnum } from '../../enums/env.enum';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(EnvVariablesEnum.JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>(
            EnvVariablesEnum.JWT_EXPIRES_IN,
            '10m'
          ),
        },
      }),
    }),
  ],
  providers: [JwtUtils],
  exports: [JwtModule, JwtUtils],
})
export class JWTWrapperModule {}
