import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import helmet from 'helmet';
import * as path from 'path';
import { AppModule } from './app.module';
import { EnvVariablesEnum } from './common/enums/env.enum';

async function bootstrap() {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.set('trust proxy', true);

  app.use(cookieParser());

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const allowedOrigins = configService
    .get<string>(EnvVariablesEnum.CORS_ALLOWED_ORIGINS)
    .split(',');

  app.enableCors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('The authentication API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>(EnvVariablesEnum.PORT) || 4001;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
