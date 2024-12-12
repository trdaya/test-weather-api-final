import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

@ObjectType()
export class FavoriteLocationDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the favorite location',
  })
  @Field(() => Number)
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Paris',
    description: 'The name of the favorite location',
  })
  @Field(() => String)
  @Expose()
  name: string;
}

export type GetFavoriteLocationsResponseDto = FavoriteLocationDto[];
