import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from '../../../modules/weather/weather.service';

@Injectable()
export class CronService {
  constructor(private readonly weatherService: WeatherService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async updateCurrentWeatherInCache() {
    return this.weatherService.updateCurrentWeatherInCache();
  }

  @Cron(CronExpression.EVERY_3_HOURS)
  async updateWeatherForecastInCache() {
    return this.weatherService.updateWeatherForecastInCache();
  }
}
