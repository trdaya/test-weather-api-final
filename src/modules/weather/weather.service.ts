/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import Redis from 'ioredis';
import { EnvVariablesEnum } from '../../common/enums/env.enum';
import { ErrorMessageEnum } from '../../common/enums/error-messages.enum';
import { delay } from '../../common/utils/time.utils';
import { LocationProvider } from '../location/location-provider.interface';
import { LOCATION_PROVIDER_TOKEN } from '../location/location-provider.token';
import {
  GetCurrentWeatherOfCityResponseDto,
  GetWeatherForecastOfCityResponseDto,
} from './dtos/weather.dtos';
import {
  cacheTimeForWeatherDataType,
  externalWeatherAPIBaseURL,
  WeatherDataTypeEnum,
} from './weather.constants';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => LOCATION_PROVIDER_TOKEN))
    private readonly locationProvider: LocationProvider,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    this.apiKey = this.configService.get<string>(
      EnvVariablesEnum.WEATHER_API_KEY,
      'YOUR_WEATHER_API_KEY'
    );
  }

  async fetchWeatherData<
    T extends
      | GetCurrentWeatherOfCityResponseDto
      | GetWeatherForecastOfCityResponseDto
  >(city: string, type: WeatherDataTypeEnum): Promise<T> {
    const cacheKey = `${type}:${city}`;
    const cacheKeyInvalid = `invalid:${city}`;

    this.logger.debug(`Fetching weather data for city: ${city}, type: ${type}`);

    const isInvalidCached = await this.cacheManager.get(cacheKeyInvalid);
    if (isInvalidCached) {
      this.logger.warn(`City "${city}" is marked as invalid in cache.`);
      throw new BadRequestException(
        `${ErrorMessageEnum.INVALID_CITY_NAME}: City "${city}" is invalid.`
      );
    }

    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache found for city: "${city}", type: "${type}"`);
      return cachedData as T;
    }

    this.logger.warn(
      `Cache miss for city: "${city}", type: "${type}". Fetching data from API.`
    );

    try {
      const encodedCity = encodeURIComponent(city);
      const endpoint =
        type === WeatherDataTypeEnum.current
          ? `${externalWeatherAPIBaseURL}/weather?q=${encodedCity}&appid=${this.apiKey}`
          : `${externalWeatherAPIBaseURL}/forecast?q=${encodedCity}&appid=${this.apiKey}`;

      this.logger.debug(`API Endpoint: ${endpoint}`);

      const { data } = await axios.get(endpoint);

      if (data.cod.toString() === '404') {
        this.logger.warn(`City "${city}" marked as invalid by API response.`);
        await this.cacheManager.set(
          cacheKeyInvalid,
          true,
          cacheTimeForWeatherDataType.invalid
        );
        throw new BadRequestException(
          `${ErrorMessageEnum.INVALID_CITY_NAME}: City "${city}" is invalid.`
        );
      }

      if (data.cod.toString() === '200') {
        this.logger.log(`API call succeeded for city: "${city}"`);
        let finalData: T;
        if (type === WeatherDataTypeEnum.current) {
          finalData = plainToInstance(
            GetCurrentWeatherOfCityResponseDto,
            data,
            {
              excludeExtraneousValues: true,
            }
          ) as T;
        } else {
          finalData = plainToInstance(
            GetWeatherForecastOfCityResponseDto,
            data,
            {
              excludeExtraneousValues: true,
            }
          ) as T;
        }

        await this.cacheManager.set(
          cacheKey,
          finalData,
          type === WeatherDataTypeEnum.current
            ? cacheTimeForWeatherDataType[WeatherDataTypeEnum.current]
            : cacheTimeForWeatherDataType[WeatherDataTypeEnum.forecast]
        );
        this.logger.log(`Data cached for city: "${city}", type: "${type}"`);
        return finalData;
      }

      throw new InternalServerErrorException('Unexpected API response.');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const { status } = error.response;
          if (status === 404) {
            this.logger.warn(
              `City "${city}" marked as invalid by API response.`
            );
            await this.cacheManager.set(
              cacheKeyInvalid,
              true,
              cacheTimeForWeatherDataType.invalid
            );
            throw new BadRequestException(
              `${ErrorMessageEnum.INVALID_CITY_NAME}: City "${city}" is invalid.`
            );
          } else if (status === 401) {
            this.logger.error(
              `Unauthorized access - invalid API key for city: "${city}".`
            );
            throw new UnauthorizedException(
              'Invalid API key. Please verify your API credentials.'
            );
          }
        }
        this.logger.error(
          `Failed to fetch weather data for city: "${city}". Status: ${error.response?.status}. Message: ${error.message}`
        );
        throw new InternalServerErrorException(
          'An error occurred while fetching weather data. Please try again later.'
        );
      }
      this.logger.error(
        `Unexpected error for city: "${city}". Message: ${error.message}`
      );
      throw new InternalServerErrorException(
        ErrorMessageEnum.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCurrentWeather(
    city: string
  ): Promise<GetCurrentWeatherOfCityResponseDto> {
    this.logger.log(`Getting current weather for city: "${city}"`);
    return this.fetchWeatherData<GetCurrentWeatherOfCityResponseDto>(
      city,
      WeatherDataTypeEnum.current
    );
  }

  async getWeatherForecast(
    city: string
  ): Promise<GetWeatherForecastOfCityResponseDto> {
    this.logger.log(`Getting weather forecast for city: "${city}"`);
    return this.fetchWeatherData<GetWeatherForecastOfCityResponseDto>(
      city,
      WeatherDataTypeEnum.forecast
    );
  }

  private async updateWeatherInCache<
    T extends
      | GetCurrentWeatherOfCityResponseDto
      | GetWeatherForecastOfCityResponseDto
  >(
    type: WeatherDataTypeEnum,
    locations: { name: string }[],
    transformFn: (data: any) => T
  ): Promise<void> {
    this.logger.log(`Updating weather data in cache for type: "${type}"`);

    const batchSize = 5;

    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);

      const promises = batch.map(({ name }) => {
        const encodedCity = encodeURIComponent(name);
        this.logger.debug(
          `Fetching weather data for city: "${name}" in batch.`
        );
        return axios
          .get<T>(
            type === WeatherDataTypeEnum.current
              ? `${externalWeatherAPIBaseURL}/weather?q=${encodedCity}&appid=${this.apiKey}`
              : `${externalWeatherAPIBaseURL}/forecast?q=${encodedCity}&appid=${this.apiKey}`
          )
          .then(response => ({ name, response }));
      });

      const results = await Promise.allSettled(promises);

      const validResults = results
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{
            name: string;
            response: AxiosResponse<T>;
          }> =>
            result.status === 'fulfilled' &&
            result.value?.response?.data?.cod?.toString() === '200'
        )
        .map(result => result.value);

      const redisClient = (this.cacheManager.store as any).getClient() as Redis;
      if (!redisClient) {
        this.logger.error('Redis client is not available.');
        throw new InternalServerErrorException('Redis client is not available');
      }

      const pipeline = redisClient.pipeline();

      validResults.forEach(({ name, response }) => {
        const cacheKey = `${type}:${name}`;
        const transformedData = transformFn(response.data);
        pipeline.set(
          cacheKey,
          JSON.stringify(transformedData),
          'EX',
          type === WeatherDataTypeEnum.current
            ? cacheTimeForWeatherDataType[WeatherDataTypeEnum.current]
            : cacheTimeForWeatherDataType[WeatherDataTypeEnum.forecast]
        );
        this.logger.debug(`Data cached for city: "${name}" in batch.`);
      });

      await pipeline.exec();

      this.logger.log(
        `Batch updated ${type} weather data for cities: ${validResults
          .map(({ name }) => name)
          .join(',')}`
      );

      if (i + batchSize < locations.length) {
        this.logger.debug('Waiting before processing next batch.');
        await delay(5000);
      }
    }
  }

  async updateCurrentWeatherInCache(): Promise<void> {
    this.logger.log('Starting cron job: updateCurrentWeather');

    const favoriteLocations =
      await this.locationProvider.getUniqueFavoriteLocationsOfAllUsers();

    await this.updateWeatherInCache(
      WeatherDataTypeEnum.current,
      favoriteLocations,
      data =>
        plainToInstance(GetCurrentWeatherOfCityResponseDto, data, {
          excludeExtraneousValues: true,
        })
    );
  }

  async updateWeatherForecastInCache(): Promise<void> {
    this.logger.log('Starting cron job: updateWeatherForecast');

    const favoriteLocations =
      await this.locationProvider.getUniqueFavoriteLocationsOfAllUsers();

    await this.updateWeatherInCache(
      WeatherDataTypeEnum.forecast,
      favoriteLocations,
      data =>
        plainToInstance(GetWeatherForecastOfCityResponseDto, data, {
          excludeExtraneousValues: true,
        })
    );
  }
}
