import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateBuildingDto } from './builing.dto';
import { MeterService } from 'src/meter/meter.service';
import { CreateMeterDto } from 'src/meter/dto/meter.dto';

@Injectable()
export class BuildingService {
  private readonly logger = new Logger(BuildingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meterService: MeterService,
  ) {}
  async findAll(
    companyId: number,
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

      return await this.prisma.building.findMany({
        where: {
          ...(or as any),
          companyId,
        },
        include: {
          // company: true,
          inverters: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: skip || 0,
        take: take || undefined,
      });
    } catch (error) {
      this.logger.error('Error fetching buildings', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.building.findUniqueOrThrow({
        where: { id },
        include: {
          company: true,
          inverters: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching building with id: ${id}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  // async createInverter(
  //   buildingId: number,
  //   createInverterDto: CreateInverterDto,
  // ) {
  //   try {
  //     return await this.prisma.inverter.create({
  //       data: {
  //         ...createInverterDto,
  //         building: { connect: { id: buildingId } },
  //       },
  //     });
  //   } catch (error) {
  //     this.logger.error(
  //       `Error creating inverter for building with id: ${buildingId}`,
  //       error.message,
  //     );
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async update(id: number, updateBuildingDto: UpdateBuildingDto) {
    try {
      return await this.prisma.building.update({
        where: { id },
        data: {
          ...updateBuildingDto,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating building with id: ${id}`,
        error.message,
      );
    }
  }

  // async remove(id: number) {
  //   try {
  //     return await this.prisma.building.delete({ where: { id } });
  //   } catch (error) {
  //     this.logger.error(
  //       `Error deleting building with id: ${id}`,
  //       error.message,
  //     );
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async asignInverter(buildingId: number, inverterId: number) {
    try {
      const building = await this.prisma.building.findUniqueOrThrow({
        where: {
          id: buildingId,
        },
      });
      return await this.prisma.inverter.update({
        where: {
          id: inverterId,
        },
        data: {
          building: { connect: { id: building.id } },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error assigning inverter with id: ${inverterId}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  async removeInverter(id: number) {
    try {
      return await this.prisma.inverter.update({
        where: {
          id,
        },
        data: {
          building: {
            disconnect: true,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error deleting inverter with id: ${id}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  async searchInverters(buildingId: number, searchTerm: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      include: { company: true },
    });

    //;

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    //;

    const projectId = building.company.projectId;

    //;

    const pattern = searchTerm
      ? new RegExp(searchTerm.split(' ').join('.*'), 'i')
      : undefined;

    const or = {
      OR: [
        { deviceSn: { contains: pattern.source, mode: 'insensitive' } },
        {
          deviceId: {
            equals: isNaN(Number(searchTerm)) ? undefined : Number(searchTerm),
          },
        },
        {
          id: {
            equals: isNaN(Number(searchTerm)) ? undefined : Number(searchTerm),
          },
        },
      ],
    };

    const inverters = await this.prisma.inverter.findMany({
      where: {
        ...(or as any),
        projectId,
      },
    });

    const assignedInverters = await this.prisma.inverter.findMany({
      where: {
        buildingId,
      },
    });

    const assignedInverterIds = assignedInverters.map(
      (inverter) => inverter.id,
    );
    const resultantInverters = inverters.filter(
      (inverter) => !assignedInverterIds.includes(inverter.id),
    );

    // //;
    // //;
    // //;

    return resultantInverters;
  }

  async searchBuildingInverters(buildingId: number, searchTerm?: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      include: { inverters: true, company: true },
    });

    //;

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    if (!searchTerm) {
      // Return empty array if no search term provided
      return [];
    }

    const pattern = new RegExp(searchTerm.split(' ').join('.*'), 'i');

    const or = {
      OR: [
        { deviceSn: { contains: pattern.source, mode: 'insensitive' } },
        {
          deviceId: {
            equals: isNaN(Number(searchTerm)) ? undefined : Number(searchTerm),
          },
        },
        {
          id: {
            equals: isNaN(Number(searchTerm)) ? undefined : Number(searchTerm),
          },
        },
      ],
    };

    //;
    const inverters = await this.prisma.inverter.findMany({
      where: {
        ...(or as any),
        buildingId: building.id,
      },
    });

    //;

    return inverters;
  }

  async createMeter(buildingId: number, createMeterDto: CreateMeterDto) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: {
        id: buildingId,
      },
    });

    return await this.prisma.meter.create({
      data: {
        ...createMeterDto,
        buildingId: building.id,
      },
    });
  }
}
