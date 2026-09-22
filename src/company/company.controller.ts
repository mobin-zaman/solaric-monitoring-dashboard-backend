import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateBuildingDto } from '../building/builing.dto';
import { UpdateCompanyDto } from './company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('/:projectId')
  async findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.companyService.findAll(projectId, search, skip, take);
  }

  @Get('/get-one/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCompanyDto);
  }

  //   @Delete(':id')
  //   async remove(@Param('id') id: number) {
  //     return this.companyService.remove(id);
  //   }

  @Post('/:companyId/building')
  async assignBuilding(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createBuildingDto: CreateBuildingDto,
  ) {
    return this.companyService.assignBuilding(companyId, createBuildingDto);
  }

  @Delete('building/:id')
  async removeBuilding(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.removeBuilding(id);
  }
}
