import { Module } from '@nestjs/common';
import { WeatherModule } from '../../../modules/weather/weather.module';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';

@Module({
  imports: [WeatherModule],
  controllers: [CronController],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
