import { Module } from '@nestjs/common';
import { InverterService } from './inverter.service';
import { InverterController } from './inverter.controller';
import { PrismaService } from 'src/prisma.service';
import { SolarmanModule } from 'src/solarman/solarman.module';
import { ExcelModule } from 'src/excel/excel.module';

@Module({
  imports: [SolarmanModule, ExcelModule],
  providers: [InverterService, PrismaService],
  controllers: [InverterController],
  exports: [InverterService],
})
export class InverterModule {}
