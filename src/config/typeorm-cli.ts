import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getTypeOrmConfig } from './typeorm-config';

ConfigModule.forRoot();
const configService = new ConfigService();
export default new DataSource(
  getTypeOrmConfig(configService) as DataSourceOptions
);
