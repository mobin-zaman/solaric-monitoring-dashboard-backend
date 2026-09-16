import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';
import { PrismaService } from 'src/prisma.service';
import { MeterService } from 'src/meter/meter.service';
import { MeterModule } from 'src/meter/meter.module';

@Module({
  imports: [MeterModule],
  providers: [BuildingService, PrismaService],
  controllers: [BuildingController],
})
export class BuildingModule {}
