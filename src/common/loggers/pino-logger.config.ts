import { ConfigService } from '@nestjs/config';
import { EnvVariablesEnum } from '../enums/env.enum';
import { NodeEnv } from '../config/env.validation';

export const pinoLoggerConfig = (configService: ConfigService) => ({
  pinoHttp: {
    level:
      configService.get<string>(EnvVariablesEnum.NODE_ENV) ===
      NodeEnv.PRODUCTION
        ? 'info'
        : 'debug',
    transport:
      configService.get<string>(EnvVariablesEnum.NODE_ENV) !==
      NodeEnv.PRODUCTION
        ? {
            targets: [
              {
                target: 'pino-pretty',
                options: { colorize: true },
              },
            ],
          }
        : undefined,
    redact: ['req.headers.authorization'],
    options: {
      destination: configService.get<string>(
        EnvVariablesEnum.LOG_FILE,
        './logs/app.log'
      ),
    },
  },
});
