import {
  ArgumentMetadata,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

export class ParseStrPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const newValue = String(value);

    // Allow only alphabetic characters (a-z, A-Z)
    if (!/^[A-Za-z]+$/.test(newValue)) {
      throw new BadRequestException('Only alphabetic strings are allowed');
    }

    return newValue;
  }
}
