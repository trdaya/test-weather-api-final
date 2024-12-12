import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { WeatherService } from '../weather/weather.service';
import { Location } from './entities/location.entity';
import { LOCATION_PROVIDER_TOKEN } from './location-provider.token';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let userService: UserService;
  let locationRepository: Repository<Location>;
  let weatherService: WeatherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: LOCATION_PROVIDER_TOKEN,
          useValue: {
            getUniqueFavoriteLocationsOfAllUsers: jest
              .fn()
              .mockResolvedValue([{ name: 'Paris' }]),
          },
        },
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Location),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(key => {
              if (key === 'MAX_FAVORITE_LOCATIONS_PER_USER') return '5';
              return null;
            }),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: WeatherService,
          useValue: {
            getCurrentWeather: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    userService = module.get<UserService>(UserService);
    locationRepository = module.get<Repository<Location>>(
      getRepositoryToken(Location)
    );
    weatherService = module.get<WeatherService>(WeatherService);
  });

  describe('favoriteLocation', () => {
    it('should add a new location to user favorites', async () => {
      const city = 'Paris';
      const userId = '123';
      const mockUser = { id: userId, locations: [] } as User;
      const mockLocation = { id: 1, name: city } as Location;

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(locationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(locationRepository, 'create').mockReturnValue(mockLocation);
      jest.spyOn(locationRepository, 'save').mockResolvedValue(mockLocation);
      jest.spyOn(userService, 'save').mockResolvedValue(undefined);

      const result = await service.favoriteLocation(city, userId);

      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { name: city },
      });
      expect(locationRepository.create).toHaveBeenCalledWith({ name: city });
      expect(locationRepository.save).toHaveBeenCalledWith(mockLocation);
      expect(userService.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(true);
    });

    it('should throw a ConflictException if location is already a favorite', async () => {
      const city = 'Paris';
      const userId = '123';
      const mockLocation = { id: 1, name: city } as Location;
      const mockUser = { id: userId, locations: [mockLocation] } as User;

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      await expect(service.favoriteLocation(city, userId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw a ConflictException if max favorite locations exceeded', async () => {
      const city = 'Rome';
      const userId = '123';
      const mockLocation = { id: 1, name: 'Location' } as Location;
      const mockUser = {
        id: userId,
        locations: Array(5).fill(mockLocation),
      } as User;

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      await expect(service.favoriteLocation(city, userId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should create a new location if it does not exist in the database', async () => {
      const city = 'Berlin';
      const userId = '123';
      const mockUser = { id: userId, locations: [] } as User;
      const mockLocation = { id: 2, name: city } as Location;

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(locationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(locationRepository, 'create').mockReturnValue(mockLocation);
      jest.spyOn(locationRepository, 'save').mockResolvedValue(mockLocation);
      jest.spyOn(userService, 'save').mockResolvedValue(undefined);

      const result = await service.favoriteLocation(city, userId);

      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { name: city },
      });
      expect(locationRepository.create).toHaveBeenCalledWith({ name: city });
      expect(locationRepository.save).toHaveBeenCalledWith(mockLocation);
      expect(userService.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(true);
    });

    it('should call WeatherService.getCurrentWeather when creating a new location', async () => {
      const city = 'Paris';
      const userId = '123';
      const mockUser = { id: userId, locations: [] } as User;
      const mockLocation = { id: 1, name: city } as Location;

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(locationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(locationRepository, 'create').mockReturnValue(mockLocation);
      jest.spyOn(locationRepository, 'save').mockResolvedValue(mockLocation);

      const weatherSpy = jest.spyOn(weatherService, 'getCurrentWeather');

      await service.favoriteLocation(city, userId);

      expect(weatherSpy).toHaveBeenCalledWith(city);
    });

    it('should not call WeatherService.getCurrentWeather if location already exists', async () => {
      const city = 'Paris';
      const userId = '123';
      const existingLocation = { id: 1, name: city } as Location;
      const mockUser = { id: userId, locations: [existingLocation] } as User;

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      const weatherSpy = jest.spyOn(weatherService, 'getCurrentWeather');

      await expect(service.favoriteLocation(city, userId)).rejects.toThrow(
        ConflictException
      );

      expect(weatherSpy).not.toHaveBeenCalled();
    });
  });
});
