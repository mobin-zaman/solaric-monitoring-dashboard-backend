import { Module } from '@nestjs/common';
import { MeterService } from './meter.service';
import { MeterController } from './meter.controller';
import { PrismaService } from 'src/prisma.service';
import { DatabaseService } from './database.service';

@Module({
  providers: [MeterService, PrismaService, DatabaseService],
  controllers: [MeterController],
  exports: [MeterService],
})
export class MeterModule {}
