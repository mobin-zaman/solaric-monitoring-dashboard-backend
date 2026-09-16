import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMeterDto {
  @IsString()
  importMeterCode: string;

  @IsString()
  exportMeterCode: string;

  @IsString()
  importMeterSerialNumber: string;

  @IsString()
  exportMeterSerialNumber: string;
}
export class UpdateMeterDto {
  @IsString()
  importMeterCode: string;

  @IsString()
  exportMeterCode: string;

  @IsString()
  importMeterSerialNumber: string;

  @IsString()
  exportMeterSerialNumber: string;
}
