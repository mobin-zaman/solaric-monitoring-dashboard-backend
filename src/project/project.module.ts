import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../prisma.service';
import { ProjectController } from './project.controller';
import { SolarmanModule } from 'src/solarman/solarman.module';
import { AuthModule } from 'src/auth/auth.module';
import { ExcelModule } from 'src/excel/excel.module';
import { InverterModule } from 'src/inverter/inverter.module';

@Module({
  imports: [SolarmanModule, AuthModule, InverterModule],
  providers: [ProjectService, PrismaService],
  controllers: [ProjectController],
})
export class ProjectModule {}
