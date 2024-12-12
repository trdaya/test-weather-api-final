import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { EnvVariablesEnum } from '../common/enums/env.enum';

export const getTypeOrmConfig = (
  configService: ConfigService
): TypeOrmModuleOptions | DataSourceOptions => ({
  type: 'postgres',
  host: configService.get<string>(EnvVariablesEnum.POSTGRES_HOST),
  port: configService.get<number>(EnvVariablesEnum.POSTGRES_PORT),
  username: configService.get<string>(EnvVariablesEnum.POSTGRES_USERNAME),
  password: configService.get<string>(EnvVariablesEnum.POSTGRES_PASSWORD),
  database: configService.get<string>(EnvVariablesEnum.POSTGRES_DB_NAME),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize:
    configService.get<string>(EnvVariablesEnum.POSTGRES_DB_SYNCHRONIZE) ===
    'true',
});
