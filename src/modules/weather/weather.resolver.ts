import { Args, Query, Resolver } from '@nestjs/graphql';
import { NormalizeCityPipe } from '../../common/pipes/normalize-city.pipe';
import { GetCurrentWeatherOfCityResponseDto } from './dtos/weather.dtos';
import { WeatherService } from './weather.service';

@Resolver()
export class WeatherResolver {
  constructor(private readonly weatherService: WeatherService) {}

  @Query(() => GetCurrentWeatherOfCityResponseDto, {
    description: 'Get current weather of a city',
  })
  async getCurrentWeather(
    @Args('city', { type: () => String }) city: string
  ): Promise<GetCurrentWeatherOfCityResponseDto> {
    const normalizedCity = new NormalizeCityPipe().transform(city);
    return this.weatherService.getCurrentWeather(normalizedCity);
  }
}
