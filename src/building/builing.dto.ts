import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  name: string;

  @IsString()
  code: string;
}

export class UpdateBuildingDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;
}
