import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType } from '@nestjs/graphql';
import { Expose, Transform, Type } from 'class-transformer';

@ObjectType()
export class BaseWeatherResponse {
  @ApiProperty({
    example: '200',
    description: 'The status code of the API response',
  })
  @Field(() => String)
  @Expose()
  @Transform(({ value }) => value.toString())
  cod: string;

  @ApiProperty({
    example: '',
    description: 'The message from the API response',
  })
  @Field(() => String)
  @Expose()
  @Transform(({ value }) => value || '')
  message: string;
}

@ObjectType()
export class WeatherDescription {
  @ApiProperty({
    example: 'clear sky',
    description: 'Description of the weather condition',
  })
  @Field(() => String)
  @Expose()
  description: string;
}

@ObjectType()
export class GetCurrentWeatherOfCityResponseDto extends BaseWeatherResponse {
  @ApiProperty({
    type: [WeatherDescription],
    description: 'Weather conditions for the city',
  })
  @Field(() => [WeatherDescription])
  @Expose()
  @Type(() => WeatherDescription)
  weather: WeatherDescription[];

  @ApiProperty({
    example: 123456,
    description: 'The ID of the city',
  })
  @Field(() => Number)
  @Expose()
  id: number;

  @ApiProperty({
    example: 'CityName',
    description: 'The name of the city',
  })
  @Field(() => String)
  @Expose()
  name: string;
}

@ObjectType()
export class WeatherForecastList {
  @ApiProperty({
    example: '2024-12-12 12:00:00',
    description: 'The date and time of the forecast',
  })
  @Field(() => String)
  @Expose()
  dt_txt: string;

  @ApiProperty({
    type: [WeatherDescription],
    description: 'Weather conditions for the forecast',
  })
  @Field(() => [WeatherDescription])
  @Expose()
  @Type(() => WeatherDescription)
  weather: WeatherDescription[];
}

@ObjectType()
export class CityDetails {
  @ApiProperty({
    example: 123456,
    description: 'The ID of the city',
  })
  @Field(() => Number)
  @Expose()
  id: number;

  @ApiProperty({
    example: 'CityName',
    description: 'The name of the city',
  })
  @Field(() => String)
  @Expose()
  name: string;
}

@ObjectType()
export class GetWeatherForecastOfCityResponseDto extends BaseWeatherResponse {
  @ApiProperty({
    type: [WeatherForecastList],
    description: 'List of weather forecasts for the city',
  })
  @Field(() => [WeatherForecastList])
  @Expose()
  @Type(() => WeatherForecastList)
  list: WeatherForecastList[];

  @ApiProperty({
    type: CityDetails,
    description: 'Details of the city for the forecast',
  })
  @Field(() => CityDetails)
  @Expose()
  @Type(() => CityDetails)
  city: CityDetails;
}
