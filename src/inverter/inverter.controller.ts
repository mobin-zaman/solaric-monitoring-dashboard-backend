// src/inverter/inverter.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { InverterService } from './inverter.service';
import { UpdateInverterDto } from './inverter.dto';

@Controller('inverter')
export class InverterController {
  constructor(private readonly inverterService: InverterService) {}

  @Get('test')
  test() {
    return this.inverterService.test();
  }

  @Get('/')
  findAll(
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.inverterService.findAll(search, skip, take);
  }

  @Get('find-one/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inverterService.findOne(id);
  }

  @Get('/generation/:inverterId')
  getGeneration(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Param('inverterId', ParseIntPipe) inverterId: number,
  ) {
    return this.inverterService.getGeneration(inverterId, startDate, endDate);
  }

  @Put('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInverterDto: UpdateInverterDto,
  ) {
    return this.inverterService.update(id, updateInverterDto);
  }
}
