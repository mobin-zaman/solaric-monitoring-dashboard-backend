// src/inverter/inverter.dto.ts

import { IsInt, IsString, IsOptional, IsNumber } from 'class-validator';

// export class CreateInverterDto {
//   @IsString()
//   deviceSn: string;

//   @IsInt()
//   deviceId: number;

//   @IsInt()
//   connectStatus: number;

//   @IsInt()
//   collectionTime: number;

//   @IsInt()
//   @IsOptional()
//   stationId?: number;
// }

export class UpdateInverterDto {
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  code: string;

  @IsString()
  @IsOptional()
  note: string;
}
