import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NormalizeCityPipe } from '../../common/pipes/normalize-city.pipe';
import { LocationModule } from '../location/location.module';
import { WeatherController } from './weather.controller';
import { WeatherResolver } from './weather.resolver';
import { WeatherService } from './weather.service';
import { LocationService } from '../location/location.service';
import { LOCATION_PROVIDER_TOKEN } from '../location/location-provider.token';

@Module({
  imports: [HttpModule, LocationModule],
  controllers: [WeatherController],
  providers: [
    WeatherService,
    WeatherResolver,
    NormalizeCityPipe,
    { provide: LOCATION_PROVIDER_TOKEN, useExisting: LocationService },
  ],
  exports: [WeatherService, NormalizeCityPipe],
})
export class WeatherModule {}
