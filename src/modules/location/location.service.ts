import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvVariablesEnum } from '../../common/enums/env.enum';
import { UserService } from '../user/user.service';
import { WeatherService } from '../weather/weather.service';
import { GetFavoriteLocationsResponseDto } from './dtos/location.dto';
import { Location } from './entities/location.entity';
import { LocationProvider } from './location-provider.interface';

@Injectable()
export class LocationService implements LocationProvider {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly userService: UserService,
    private readonly weatherService: WeatherService,
    private readonly configService: ConfigService
  ) {}

  async favoriteLocation(city: string, userId: string): Promise<boolean> {
    this.logger.log(
      `Attempting to add location "${city}" to user ${userId}'s favorites.`
    );
    const user = await this.userService.findById(userId);

    const existingLocation = user.locations.find(loc => loc.name === city);
    if (existingLocation) {
      this.logger.warn(
        `Location "${city}" is already a favorite for user ${userId}.`
      );
      throw new ConflictException(
        `Location "${city}" is already in your favorites.`
      );
    }

    const maxFavorites = parseInt(
      this.configService.get<string>(
        EnvVariablesEnum.MAX_FAVORITE_LOCATIONS_PER_USER,
        '3'
      ),
      10
    );

    if (user.locations.length >= maxFavorites) {
      this.logger.warn(
        `User ${userId} exceeded the maximum allowed favorite locations (${maxFavorites}).`
      );
      throw new ConflictException(
        `You cannot have more than ${maxFavorites} favorite locations.`
      );
    }

    let location = await this.locationRepository.findOne({
      where: { name: city },
    });

    if (!location) {
      const currentWeather = await this.weatherService.getCurrentWeather(city);
      if (currentWeather) {
        this.logger.log(
          `Creating new location "${city}" as it does not exist in the database.`
        );
        location = this.locationRepository.create({ name: city });
        location = await this.locationRepository.save(location);
      }
    }

    user.locations.push(location);
    await this.userService.save(user);

    this.logger.log(
      `Location "${city}" added to user ${userId}'s favorites successfully.`
    );
    return true;
  }

  async getFavoriteLocations(
    userId: string
  ): Promise<GetFavoriteLocationsResponseDto> {
    this.logger.log(`Retrieving favorite locations for user ${userId}.`);
    const user = await this.userService.findById(userId);

    this.logger.log(
      `Found ${user.locations.length} favorite locations for user ${userId}.`
    );
    return user.locations.map(({ id, name }) => ({
      id,
      name,
    }));
  }

  async unfavoriteLocation(
    locationId: number,
    userId: string
  ): Promise<boolean> {
    this.logger.log(
      `Attempting to remove location ID ${locationId} from user ${userId}'s favorites.`
    );
    const user = await this.userService.findById(userId);

    const location = user.locations.find(loc => loc.id === locationId);

    if (!location) {
      this.logger.warn(
        `Location with ID ${locationId} is not a favorite for user ${userId}.`
      );
      throw new BadRequestException(
        `Location with ID ${locationId} is not a favorite.`
      );
    }

    user.locations = user.locations.filter(loc => loc.id !== locationId);

    await this.userService.save(user);

    this.logger.log(
      `Location ID ${locationId} removed from user ${userId}'s favorites successfully.`
    );
    return true;
  }

  async getUniqueFavoriteLocationsOfAllUsers(): Promise<
    Array<{
      name: string;
    }>
  > {
    this.logger.log('Retrieving unique favorite locations of all users.');
    const locations = await this.locationRepository
      .createQueryBuilder('location')
      .innerJoin('location.users', 'user')
      .select(['location.name AS name'])
      .distinct(true)
      .getRawMany();

    this.logger.log(
      `Found ${locations.length} unique favorite locations across all users.`
    );
    return locations;
  }
}
