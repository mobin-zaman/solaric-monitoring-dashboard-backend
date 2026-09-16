import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/prisma.service';
import { DashboardController } from './dashboard.controller';
import { InverterModule } from 'src/inverter/inverter.module';
import { MeterModule } from 'src/meter/meter.module';
import { SolarmanModule } from 'src/solarman/solarman.module';

@Module({
  imports: [InverterModule, MeterModule, SolarmanModule],
  providers: [DashboardService, PrismaService],
  controllers: [DashboardController],
})
export class DashboardModule {}
