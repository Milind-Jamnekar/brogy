import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsBooleanString()
  published?: string; // or boolean, depending on your pipe

  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value as Array<string>;
    }

    if (typeof value === 'string') {
      return [value];
    }
  })
  tags?: Array<string>;
}
