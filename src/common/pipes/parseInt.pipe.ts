import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (Number.isNaN(val)) {
      throw new BadRequestException(`${value} is not a valid number.`);
    }
    return val;
  }
}
