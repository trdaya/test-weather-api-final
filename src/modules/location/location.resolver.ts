import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/modules/jwt-wrapper/jwt-wrapper-auth.guard';
import { NormalizeCityPipe } from '../../common/pipes/normalize-city.pipe';
import { GraphQLContext } from '../../common/types/graphql-context';
import { FavoriteLocationDto } from './dtos/location.dto';
import { Location } from './entities/location.entity';
import { LocationService } from './location.service';

@UseGuards(JwtAuthGuard)
@Resolver(() => Location)
export class LocationResolver {
  constructor(private readonly locationService: LocationService) {}

  @Query(() => [FavoriteLocationDto], {
    description: 'Get all favorite locations',
  })
  async getFavoriteLocations(
    @Context() context: GraphQLContext
  ): Promise<FavoriteLocationDto[]> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.locationService.getFavoriteLocations(userId);
  }

  @Mutation(() => Boolean, { description: 'Favorite a location' })
  async favoriteLocation(
    @Args('city', { type: () => String }) city: string,
    @Context() context: GraphQLContext
  ): Promise<boolean> {
    const normalizedCity = new NormalizeCityPipe().transform(city);
    const userId = context.req.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.locationService.favoriteLocation(normalizedCity, userId);
  }
}
