import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NormalizeCityPipe } from '../../common/pipes/normalize-city.pipe';
import { UserModule } from '../user/user.module';
import { WeatherModule } from '../weather/weather.module';
import { Location } from './entities/location.entity';
import { LocationController } from './location.controller';
import { LocationResolver } from './location.resolver';
import { LocationService } from './location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    UserModule,
    forwardRef(() => WeatherModule),
  ],
  controllers: [LocationController],
  providers: [LocationService, NormalizeCityPipe, LocationResolver],
  exports: [LocationService, NormalizeCityPipe],
})
export class LocationModule {}
