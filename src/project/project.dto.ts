// src/project/dto/create-project.dto.ts
import { ProjectFundingType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
// import { PartialType } from '@nestjs/mapped-types';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  solarmanPlantId: number;

  @IsEnum(ProjectFundingType)
  @IsOptional()
  fundingType?: ProjectFundingType;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  solarmanPlantId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProjectFundingType)
  @IsOptional()
  fundingType?: ProjectFundingType;

  @IsOptional()
  tarrif: number;

  @IsOptional()
  dollarRate: number;

  @IsOptional()
  exportMeterSerialNumber: string;

  @IsOptional()
  importMeterSerialNumber: string;

  @IsOptional()
  imageUrl: string;
}
