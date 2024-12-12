import { Controller, Get, Param, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NormalizeCityPipe } from '../../common/pipes/normalize-city.pipe';
import { WeatherService } from './weather.service';
import {
  GetCurrentWeatherOfCityResponseDto,
  GetWeatherForecastOfCityResponseDto,
} from './dtos/weather.dtos';

@ApiTags('weather')
@Controller()
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({ summary: 'Get current weather of a city' })
  @ApiResponse({
    status: 200,
    description: 'Current weather details retrieved successfully.',
    type: GetCurrentWeatherOfCityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid city name.',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found.',
  })
  @Version('1')
  @Get('weather/:city')
  getCurrentWeather(@Param('city', NormalizeCityPipe) city: string) {
    return this.weatherService.getCurrentWeather(city);
  }

  @ApiOperation({ summary: 'Get 5-day weather forecast of a city' })
  @ApiResponse({
    status: 200,
    description: '5-day weather forecast retrieved successfully.',
    type: GetWeatherForecastOfCityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid city name.',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found.',
  })
  @Version('1')
  @Get('forecast/:city')
  getWeatherForecast(@Param('city', NormalizeCityPipe) city: string) {
    return this.weatherService.getWeatherForecast(city);
  }
}
