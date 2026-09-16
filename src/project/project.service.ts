import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { CreateCompanyDto } from '../company/company.dto';
import { SolarmanService } from 'src/solarman/solarman.service';
import { match } from 'assert';
import { UserRole } from '@prisma/client';
import * as imgbbUploader from 'imgbb-uploader';
import { ExcelService } from 'src/excel/excel.service';
import { InverterService } from 'src/inverter/inverter.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private solarman: SolarmanService,
    private inverterService: InverterService, //   private excelService: ExcelService,
  ) {}

  async test() {
    const options = {
      apiKey: '03f5bb0027dc1f7b3042cf33f484c030', // MANDATORY

      base64string:
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNcLVNbzwAEjDAGACcSA4kB6ARiAAAAAElFTkSuQmCC',
      // OPTIONAL: pass base64-encoded image (max 32Mb)
    };

    // const response = await imgbbUploader(options);
    console.log('Runnning test');
    //;
  }

  async create(createProjectDto: CreateProjectDto) {
    try {
      const solarmanPlantList: any = await this.solarman.getProjectList();
      // //;

      const matchedSolarmanPlant = solarmanPlantList.find(
        (solarmanPlant) =>
          solarmanPlant.id === createProjectDto.solarmanPlantId,
      );

      if (!matchedSolarmanPlant) {
        throw new BadRequestException(
          'Solarman plant not found, please provide proper plant ID',
        );
      }

      if (matchedSolarmanPlant) {
        //;

        //now getting devices for the project

        const deviceList: any = await this.solarman.getAllDevices(
          matchedSolarmanPlant.id,
        );

        //;
        const project = await this.prisma.project.create({
          data: { ...(createProjectDto as any), meta: matchedSolarmanPlant },
        });

        // for (const device of deviceList) {
        //   await this.prisma.inverter.create({
        //     data: {
        //       ...device,
        //       project: { connect: { id: project.id } },
        //     },
        //   });
        // }

        await this.prisma.inverter.createMany({
          data: deviceList.map((device) => ({
            ...device,
            projectId: project.id,
          })),
        });

        // await this.prisma.inverter.createMany({
        //   data: {...deviceList, projectId: project.id},
        // })

        //;
        return await this.prisma.project.findUnique({
          where: {
            id: project.id,
          },
          include: {
            inverters: true,
          },
        });
      }

      // co
    } catch (error) {
      this.logger.error('Error creating project', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    search?: string,
    skip?: number,
    take?: number,
    firebaseUid?: string,
  ) {
    try {
      //;
      //;
      const pattern = search
        ? new RegExp(search.split(' ').join('.*'), 'i')
        : undefined;

      const or = pattern
        ? {
            OR: [
              { name: { contains: pattern.source, mode: 'insensitive' } },
              {
                description: { contains: pattern.source, mode: 'insensitive' },
              },
            ],
          }
        : {};

      const result: any = await this.prisma.project.findMany({
        include: {
          users: {
            include: {
              user: true,
            },
          },
          companies: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: skip || 0,
        take: take || undefined,
      });

      if (!firebaseUid) {
        //;
        result.push({ id: -345, name: 'ALL' });
        return result;
      }

      const filteredProjects = result.filter((project) => {
        return project.users.some((userProject) => {
          return userProject.user.firebaseUid === firebaseUid;
        });
      });

      return filteredProjects;
    } catch (error) {
      this.logger.error('Error fetching projects', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.project.findUniqueOrThrow({
        where: { id },
        include: {
          companies: true,
          inverters: true,
          users: {
            include: {
              user: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching project with id: ${id}`, error.message);
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    try {
      //if the user is changing the solarman plant id, then we need to update the meta
      if (updateProjectDto.solarmanPlantId) {
        const solarmanPlantList: any = await this.solarman.getProjectList();
        // //;

        const matchedSolarmanPlant = solarmanPlantList.find(
          (solarmanPlant) =>
            solarmanPlant.id === updateProjectDto.solarmanPlantId,
        );

        if (!matchedSolarmanPlant) {
          throw new BadRequestException(
            'Solarman plant not found, please provide proper plant ID',
          );
        }

        if (matchedSolarmanPlant) {
          //;
          return await this.prisma.project.update({
            where: {
              solarmanPlantId: matchedSolarmanPlant.id,
            },
            data: {
              ...updateProjectDto,
              meta: matchedSolarmanPlant,
            },
          });
        }
      }

      return await this.prisma.project.update({
        where: { id },
        data: updateProjectDto as any,
      });
    } catch (error) {
      this.logger.error(`Error updating project with id: ${id}`, error.message);
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Error deleting project with id: ${id}`, error.message);
      throw new BadRequestException(error.message);
    }
  }

  async assignCompany(projectId: number, company: CreateCompanyDto) {
    try {
      const createdCompany = await this.prisma.company.create({
        data: {
          ...company,
        },
      });

      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          companies: {
            connect: { id: createdCompany.id },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error assigning company to project with id: ${projectId}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  // project.service.ts

  async assignUser(projectId: number, userId: number) {
    if (!userId) {
      throw new BadRequestException('userId cannot be empty');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    });

    if (user.role !== UserRole.USER) {
      throw new BadRequestException(
        'User who needs to be assigned, must be of user role',
      );
    }

    try {
      // Create a new entry in the UserProject model
      return await this.prisma.userProject.create({
        data: {
          user: { connect: { id: userId } },
          project: { connect: { id: projectId } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error assigning user with id: ${userId} to project with id: ${projectId}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  async unassignUser(projectId: number, userId: number) {
    if (!userId) {
      throw new BadRequestException('userId cannot be empty');
    }

    try {
      return await this.prisma.userProject.delete({
        where: { userId_projectId: { userId, projectId } },
      });
    } catch (error) {
      this.logger.error(
        `Error unassigning user with id: ${userId} from project with id: ${projectId}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  async unassignCompany(projectId: number, companyId: number) {
    if (!companyId) {
      throw new BadRequestException('companyId cannot be empty');
    }

    try {
      const updatedCompany = await this.prisma.project.update({
        where: { id: projectId },
        data: { companies: { disconnect: { id: companyId } } },
      });

      await this.prisma.company.delete({
        where: {
          id: companyId,
        },
      });

      return updatedCompany;
    } catch (error) {
      this.logger.error(
        `Error unassigning company with id: ${companyId} from project with id: ${projectId}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  async updateInvertersForProject(projectId: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { inverters: true },
      });

      if (!project) {
        throw new BadRequestException('Project not found');
      }

      const existingInverterDeviceIds = project.inverters.map(
        (inverter) => inverter.deviceId,
      );

      const updatedDeviceList: any = await this.solarman.getAllDevices(
        project.solarmanPlantId,
      );

      // //;

      const newInverters = updatedDeviceList.filter(
        (device) => !existingInverterDeviceIds.includes(device.deviceId),
      );

      if (newInverters.length > 0) {
        await this.prisma.inverter.createMany({
          data: newInverters.map((inverter) => ({
            ...inverter,
            projectId: project.id,
          })),
        });
      }

      return await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { inverters: true },
      });
    } catch (error) {
      this.logger.error('Error updating inverters for project', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async uploadExcel(path) {
    console.log('Executing uploadExcel');
    // //

    // return result;
    await this.inverterService.uploadExcelData(path);
  }
}
