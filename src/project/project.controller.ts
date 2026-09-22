// src/project/project.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Put,
  BadRequestException,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { CreateCompanyDto } from '../company/company.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from 'src/auth/roles.enum';
import { Roles } from 'src/auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import fileType from 'file-type';
import * as uuid from 'uuid';

@Controller('project')
@UsePipes(ValidationPipe)
@UseGuards(AuthGuard, RolesGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('/test')
  async test() {
    return this.projectService.test();
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Roles(Role.ADMIN, Role.ENGINEER, Role.USER)
  @Get()
  async findAll(
    @Req() request,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    // //
    // //
    if (request.user.role === Role.USER) {
      // //
      return await this.projectService.findAll(
        search,
        skip,
        take,
        request.user.uid,
      );
    }
    return await this.projectService.findAll(search, skip, take);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':projectId/companies')
  async assignCompany(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    // //;
    return await this.projectService.assignCompany(projectId, createCompanyDto);
  }

  @Roles(Role.ADMIN)
  @Post(':projectId/assign-user/:userId')
  async assignUser(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.projectService.assignUser(projectId, userId);
  }

  // @Roles(Role.ADMIN)
  @Delete(':projectId/user/:userId')
  async unassignUser(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.projectService.unassignUser(projectId, userId);
  }

  @Roles(Role.ADMIN)
  @Delete(':projectId/company/:companyId')
  async unassignCompany(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return await this.projectService.unassignCompany(projectId, companyId);
  }

  @Roles(Role.ADMIN)
  @Put(':id/update-inverters')
  async updateInvertersForProject(
    @Param('id', ParseIntPipe) projectId: number,
  ) {
    try {
      const updatedProject =
        await this.projectService.updateInvertersForProject(projectId);
      return updatedProject;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @Roles(Role.ADMIN)
  @Get(':/projectId/inverter/:search')
  async searchInvertersForProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('search') search?: string,
  ) {}

  // @Roles(Role.ADMIN)
  @Post('excel-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: '/tmp/',
        filename: (req, file, cb) => {
          const fileName = `${Date.now()}-${uuid.v1()}.xlsx`;
          cb(null, fileName);
        },
      }),
    }),
  )
  async uploadExcel(@UploadedFile() file) {
    console.log('INTO UPLOAD EXCEL CONTROLLER');
    console.log({ file });
    await this.projectService.uploadExcel(file.path);
  }
}
