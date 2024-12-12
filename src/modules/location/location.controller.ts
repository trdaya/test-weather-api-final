import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/modules/jwt-wrapper/jwt-wrapper-auth.guard';
import { NormalizeCityPipe } from '../../common/pipes/normalize-city.pipe';
import { ParseIntPipe } from '../../common/pipes/parseInt.pipe';
import { FavoriteLocationDto } from './dtos/location.dto';
import { LocationService } from './location.service';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationController {
  constructor(private readonly locationsService: LocationService) {}

  @ApiOperation({ summary: 'Get favorite locations of a user' })
  @ApiResponse({
    status: 200,
    description: 'Favorite locations retrieved successfully.',
    type: [FavoriteLocationDto],
  })
  @Version('1')
  @Get()
  getFavoriteLocations(@Req() req: Request): Promise<FavoriteLocationDto[]> {
    const userId = req.user.id;
    return this.locationsService.getFavoriteLocations(userId);
  }

  @ApiOperation({ summary: 'Favorite a location' })
  @ApiResponse({
    status: 201,
    description: 'Location added to favorites successfully.',
    schema: {
      example: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid city name.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Location already in favorites.',
  })
  @Version('1')
  @Post()
  favoriteLocation(
    @Body('city', NormalizeCityPipe) city: string,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    return this.locationsService.favoriteLocation(city, userId);
  }

  @ApiOperation({ summary: 'Unfavorite a location' })
  @ApiResponse({
    status: 200,
    description: 'Location removed from favorites successfully.',
    schema: {
      example: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid location ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found in favorites.',
  })
  @Version('1')
  @Delete(':id')
  unfavoriteLocation(
    @Param('id', ParseIntPipe) locationId: number,
    @Req() req: Request
  ) {
    const userId = req.user.id;
    return this.locationsService.unfavoriteLocation(locationId, userId);
  }
}
