import { Controller, HttpCode, Post, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../jwt-wrapper/jwt-wrapper-auth.guard';
import { CronService } from './cron.service';

@ApiTags('cron')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cron')
export class CronController {
  constructor(private readonly weatherService: CronService) {}

  @ApiOperation({
    summary: 'Update current weather of all favorite locations in cache',
  })
  @Version('1')
  @HttpCode(200)
  @Post('update-current-weather')
  async updateCurrentWeatherInCache() {
    return this.weatherService.updateCurrentWeatherInCache();
  }

  @ApiOperation({
    summary: 'Update weather forecast of all favorite locations in cache',
  })
  @Version('1')
  @HttpCode(200)
  @Post('update-weather-forecast')
  async updateWeatherForecastInCache() {
    return this.weatherService.updateWeatherForecastInCache();
  }
}
