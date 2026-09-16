// src/building/building.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Query,
  ParseIntPipe,
  Put,
  NotFoundException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BuildingService } from './building.service';
import { UpdateBuildingDto } from './builing.dto';
import { CreateMeterDto } from 'src/meter/dto/meter.dto';

@Controller('building')
@UsePipes(ValidationPipe)
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get('/find-one/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.buildingService.findOne(id);
  }

  @Delete('inverter/:id')
  removeInverter(@Param('id', ParseIntPipe) id: number) {
    return this.buildingService.removeInverter(id);
  }

  @Get('inverter/:buildingId/search')
  async searchInverters(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Query('search') searchTerm: string,
  ) {
    try {
      const inverters = await this.buildingService.searchInverters(
        buildingId,
        searchTerm,
      );
      return inverters;
    } catch (error) {
      throw error;
    }
  }

  @Post('meter/:buildingId/')
  async createMeter(
    @Param('buildingId', ParseIntPipe) id: number,
    @Body() createMeterDto: CreateMeterDto,
  ) {
    return await this.buildingService.createMeter(id, createMeterDto);
  }

  // Place the more generic route after the specific routes
  @Get('/:cid')
  findAll(
    @Param('cid', ParseIntPipe) cid: number,
    @Query('search') search?: string,
    // @Query('skip', ParseIntPipe) skip?: number,
    // @Query('take', ParseIntPipe) take?: number,
  ) {
    //;
    //;
    const skip = null;
    const take = null;
    return this.buildingService.findAll(cid, search, skip, take);
  }

  @Get('/:buildingId/inverter/search')
  async searchBuildingInverters(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Query('search') searchTerm: string,
  ) {
    return this.buildingService.searchBuildingInverters(buildingId, searchTerm);
  }

  @Post(':id/inverter/:inverterId')
  assignInverter(
    @Param('id', ParseIntPipe) id: number,
    @Param('inverterId', ParseIntPipe) inverterId: number,
  ) {
    return this.buildingService.asignInverter(id, inverterId);
  }

  @Put(':id')
  updateBuilding(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingService.update(id, updateBuildingDto);
  }

  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.buildingService.remove(id);
  // }

  // @Post(':id/inverter')
  // createInverter(
  //   @Param('id', ParseIntPipe) buildingId: number,
  //   @Body() createInverterDto: CreateInverterDto,
  // ) {
  //   return this.buildingService.createInverter(buildingId, createInverterDto);
  // }
}
