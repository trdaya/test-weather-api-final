export enum WeatherDataTypeEnum {
  'current' = 'current',
  'forecast' = 'forecast',
}

export const cacheTimeForWeatherDataType = {
  [WeatherDataTypeEnum.current]: 60 * 60,
  [WeatherDataTypeEnum.forecast]: 60 * 60 * 3,
  invalid: 60 * 60 * 6,
};

export const externalWeatherAPIBaseURL =
  'https://api.openweathermap.org/data/2.5';
