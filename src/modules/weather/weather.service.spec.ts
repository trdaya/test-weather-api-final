import { HttpModule } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { LOCATION_PROVIDER_TOKEN } from '../location/location-provider.token';
import { GetCurrentWeatherOfCityResponseDto } from './dtos/weather.dtos';
import { WeatherDataTypeEnum } from './weather.constants';
import { WeatherService } from './weather.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  let service: WeatherService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        WeatherService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(key => {
              if (key === 'SOME_CONFIG_KEY') {
                return 'SomeValue';
              }
              return null;
            }),
          },
        },
        {
          provide: LOCATION_PROVIDER_TOKEN,
          useValue: {
            getUniqueFavoriteLocationsOfAllUsers: jest
              .fn()
              .mockResolvedValue([{ name: 'Paris' }]),
          },
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('fetchWeatherData', () => {
    it('should return cached data if available', async () => {
      const city = 'London';
      const type = WeatherDataTypeEnum.current;
      const mockCachedData: GetCurrentWeatherOfCityResponseDto = {
        cod: '200',
        message: '',
        weather: [{ description: 'Cloudy' }],
        id: 2,
        name: 'London',
      };

      jest
        .spyOn(cacheManager, 'get')
        .mockImplementation(async (key: string) => {
          if (key === `invalid:${city}`) return null;
          if (key === `${type}:${city}`) return mockCachedData;
          return null;
        });

      const result = await service.fetchWeatherData(city, type);

      expect(cacheManager.get).toHaveBeenCalledWith(`${type}:${city}`);
      expect(result).toEqual(mockCachedData);
    });

    it('should throw BadRequestException for invalid city', async () => {
      const city = 'InvalidCity';
      const type = WeatherDataTypeEnum.current;

      jest
        .spyOn(cacheManager, 'get')
        .mockImplementation(async (key: string) => {
          if (key === `invalid:${city}`) return true;
          return null;
        });

      await expect(service.fetchWeatherData(city, type)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should fetch data from API and cache it', async () => {
      const city = 'Paris';
      const type = WeatherDataTypeEnum.current;
      const mockApiResponse = {
        data: {
          cod: '200',
          message: '',
          weather: [{ description: 'Clear sky' }],
          id: 3,
          name: 'Paris',
        },
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
      mockedAxios.get.mockResolvedValueOnce(mockApiResponse);
      jest.spyOn(cacheManager, 'set').mockResolvedValueOnce(undefined);

      const result = await service.fetchWeatherData(city, type);

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        `${type}:${city}`,
        mockApiResponse.data,
        3600
      );
      expect(result).toEqual(mockApiResponse.data);
    });

    it('should throw InternalServerErrorException on API error', async () => {
      const city = 'Berlin';
      const type = WeatherDataTypeEnum.forecast;

      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
      mockedAxios.get.mockRejectedValueOnce(
        new InternalServerErrorException('API Error')
      );

      await expect(service.fetchWeatherData(city, type)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
});
