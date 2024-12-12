import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-ioredis';
import { LoggerModule } from 'nestjs-pino';
import { validate } from './common/config/env.validation';
import { EnvVariablesEnum } from './common/enums/env.enum';
import { CustomThrottlerGuard } from './common/guards/custom-throttle.guard';
import { pinoLoggerConfig } from './common/loggers/pino-logger.config';
import { CronModule } from './common/modules/cron/cron.module';
import { JWTWrapperModule } from './common/modules/jwt-wrapper/jwt-wrapper.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationModule } from './modules/location/location.module';
import { UserModule } from './modules/user/user.module';
import { WeatherModule } from './modules/weather/weather.module';
import { getTypeOrmConfig } from './config/typeorm-config';

@Module({
  imports: [
    ConfigModule.forRoot({ validate, isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>(
          EnvVariablesEnum.REDIS_HOST,
          'localhost'
        ),
        port: configService.get<number>(EnvVariablesEnum.REDIS_PORT, 6379),
        ttl: 60 * 60, // 1 hour
      }),
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl:
              configService.get<number>(EnvVariablesEnum.RATE_LIMIT_TTL) ||
              60 * 1000, // 1 min
            limit:
              configService.get<number>(EnvVariablesEnum.RATE_LIMIT_LIMIT) ||
              10,
          },
        ],
        storage: new ThrottlerStorageRedisService(),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req, res }) => ({ req, res }),
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        pinoLoggerConfig(configService),
    }),
    JWTWrapperModule,
    AuthModule,
    UserModule,
    WeatherModule,
    LocationModule,
    CronModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
