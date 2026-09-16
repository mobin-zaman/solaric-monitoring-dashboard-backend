import { Controller, ParseIntPipe } from '@nestjs/common';
import { Post, Query, Get, Body, Put, Delete, Param } from '@nestjs/common';
import { MeterService } from './meter.service';
import { UpdateMeterDto } from './dto/meter.dto';

@Controller('meter')
export class MeterController {
  constructor(private readonly meterService: MeterService) {}

  //   @Post()
  //   async createMeter(@Body() data: Prisma.MeterCreateInput) {
  //     return this.meterService.createMeter(data);
  //   }
  @Get(':id')
  async getMeter(@Param('id', ParseIntPipe) id: number) {
    return this.meterService.getMeter(id);
  }

  @Put(':id')
  async updateMeter(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateMeterDto,
  ) {
    return this.meterService.updateMeter(id, data);
  }

  @Delete(':id')
  async deleteMeter(@Param('id', ParseIntPipe) id: number) {
    return this.meterService.deleteMeter(id);
  }

  @Get('/')
  async getAllMeters(
    @Query('search') search: string,
    // @Query('buildingId', ParseIntPipe) buildingId: number,
  ) {
    return this.meterService.getAllMeters(search);
  }

  @Get('/building/:buildingId')
  async getBuildingMeters(
    @Query('search') search: string,
    @Param('buildingId', ParseIntPipe) buildingId: number,
  ) {
    return this.meterService.getAllMeters(search, buildingId);
  }
}
