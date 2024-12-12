import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class NormalizeCityPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value !== 'string') {
      throw new BadRequestException('City must be a string');
    }

    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) {
      throw new BadRequestException('City cannot be empty');
    }

    return normalizedValue;
  }
}
