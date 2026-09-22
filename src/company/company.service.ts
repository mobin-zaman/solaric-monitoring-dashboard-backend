// src/company/company.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
// import { UpdateCompanyDto } from './dto/update-company.dto';
// import { CreateBuildingDto } from '../building/dto/create-building.dto';
import { UpdateCompanyDto } from './company.dto';
import { CreateBuildingDto } from 'src/building/builing.dto';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // async create(createCompanyDto: CreateCompanyDto) {
  // 	try {
  // 		return await this.prisma.company.create({ data: createCompanyDto });
  // 	} catch (error) {
  // 		this.logger.error('Error creating company', error.message);
  // 		throw new BadRequestException(error.message);
  // 	}
  // }
  async findAll(
    projectId: number,
    search?: string,
    skip?: number,
    take?: number,
  ) {
    try {
      const pattern = search
        ? new RegExp(search.split(' ').join('.*'), 'i')
        : undefined;

      const or = pattern
        ? {
            OR: [
              { name: { contains: pattern.source, mode: 'insensitive' } },
              { code: { contains: pattern.source, mode: 'insensitive' } },
            ],
          }
        : {};

      return await this.prisma.company.findMany({
        where: {
          projectId,
          ...(or as any),
        },
        include: {
          // project: true,
          buildings: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: skip || 0,
        take: take || undefined,
      });
    } catch (error) {
      this.logger.error('Error fetching companies', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.company.findUniqueOrThrow({
        where: { id },
        include: {
          project: true,
          buildings: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching company with id: ${id}`, error.message);
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    try {
      return await this.prisma.company.update({
        where: { id },
        data: updateCompanyDto,
      });
    } catch (error) {
      this.logger.error(`Error updating company with id: ${id}`, error.message);
      throw new BadRequestException(error.message);
    }
  }

  // async remove(id: number) {
  //   try {
  //     return await this.prisma.company.delete({ where: { id } });
  //   } catch (error) {
  //     this.logger.error(`Error deleting company with id: ${id}`, error.message);
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async assignBuilding(
    companyId: number,
    createBuildingDto: CreateBuildingDto,
  ) {
    try {
      return await this.prisma.building.create({
        data: {
          ...createBuildingDto,
          company: { connect: { id: companyId } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating building for company with id: ${companyId}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  // Add this method inside the CompanyService class in src/company/company.service.ts

  async removeBuilding(id: number) {
    try {
      return await this.prisma.building.delete({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Error deleting building with id: ${id}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }
}
