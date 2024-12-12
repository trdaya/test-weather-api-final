import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}
class EnvironmentVariables {
  @IsNotEmpty()
  @IsEnum(NodeEnv, {
    message: 'NODE_ENV must be either "development" or "production"',
  })
  NODE_ENV: NodeEnv;

  @IsNumber()
  @Type(() => Number)
  PORT = 4001;

  @IsString()
  TZ = 'UTC';

  @IsString()
  LOG_FILE = './logs/app.log';

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN = '10m';

  @IsString()
  ACCESS_TOKEN_EXPIRES_IN = '5m';

  @IsString()
  REFRESH_TOKEN_EXPIRES_IN = '20m';

  @IsString()
  @IsNotEmpty()
  CORS_ALLOWED_ORIGINS: string;

  @IsString()
  @IsNotEmpty()
  COOKIE_SECURE: string;

  @IsString()
  @IsNotEmpty()
  COOKIE_SAME_SITE: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PORT: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB_SYNCHRONIZE: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PORT: string;

  @IsString()
  @IsNotEmpty()
  WEATHER_API_KEY: string;

  @IsNumber()
  @Type(() => Number)
  MAX_USERS = 4;

  @IsNumber()
  @Type(() => Number)
  MAX_FAVORITE_LOCATIONS_PER_USER = 3;

  @IsNumber()
  @Type(() => Number)
  RATE_LIMIT_TTL = 60000;

  @IsNumber()
  @Type(() => Number)
  RATE_LIMIT_LIMIT = 10;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig);
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
