// src/inverter/inverter.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateInverterDto } from './inverter.dto';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { SolarmanService } from 'src/solarman/solarman.service';
import { Inverter, InverterUpdateStatus } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';
import { ExcelService } from 'src/excel/excel.service';
@Injectable()
export class InverterService {
  private readonly logger = new Logger(InverterService.name);
  private lastUpdatedIndex = 0;

  private SYNC_ENABLED = true;
  constructor(
    private readonly prisma: PrismaService,
    private readonly solarman: SolarmanService,
    private excelService: ExcelService,
  ) {
    if (this.SYNC_ENABLED == true) {
      this.updateInverterFrameData();
    }
  }

  async test() {}

  async findAll(search?: string, skip?: number, take?: number) {
    try {
      const pattern = search
        ? new RegExp(search.split(' ').join('.*'), 'i')
        : undefined;

      const or = pattern
        ? {
            OR: [
              { deviceSn: { contains: pattern.source, mode: 'insensitive' } },
              // { deviceId: Number(search) }, // Convert search to number and directly compare

              // { deviceId: { contains: pattern.source, mode: 'insensitive' } },
            ],
          }
        : {};

      return await this.prisma.inverter.findMany({
        where: {
          ...(or as any),
        },
        include: {
          project: true,
          building: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: skip || 0,
        take: take || undefined,
      });
    } catch (error) {
      this.logger.error('Error fetching inverters', error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.inverter.findUnique({
        where: { id },
        include: {
          project: true,
          building: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching inverter with id: ${id}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  @Interval(900)
  async runInverterDailyDataUpdate() {
    if (this.SYNC_ENABLED == true) {
      try {
        this.handleInverterDailyDataUpdate();
      } catch (error) {}
    }
  }

  // @Cron('20 * * * *')
  async handleInverterDailyDataUpdate() {
    // //
    const inverters = await this.prisma.inverter.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    if (inverters.length === 0) {
      this.lastUpdatedIndex = 0;
      return;
    }

    // //

    // Reset index to 0 if it exceeds the inverters length
    if (this.lastUpdatedIndex >= inverters.length) {
      this.lastUpdatedIndex = 0;
    }

    // //
    // //

    const inverter = inverters[this.lastUpdatedIndex];
    // //

    // Check if the inverter is not null or undefined
    if (inverter) {
      // //
      // //
      await this.updateInverterDailyData(inverter);
      //;
      //;
    }

    this.lastUpdatedIndex++;
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async runUpdateInverterFrameData() {
    if (this.SYNC_ENABLED == true) {
      try {
        this.updateInverterFrameData();
      } catch (error) {}
    }
  }

  async updateInverterFrameData() {
    const today = dayjs().format('YYYY-MM-DD');
    // today.setHours(23, 59, 59, 999); // set to end of today
    //;

    const inverterDailyDataRecords =
      await this.prisma.inverterDailyData.findMany({
        include: {
          inverter: true,
        },
        where: {
          updateStatus: InverterUpdateStatus.PENDING,
          // collectTime: new Date(today),
        },
      });

    //;
    //;

    for (const record of inverterDailyDataRecords) {
      //;

      const isToday = record.collectTime.toISOString().split('T')[0] === today;
      const formattedDate = record.collectTime.toISOString().split('T')[0];

      // If dailyFrameData.collectTime is today
      if (isToday) {
        //;

        const retrievedFrameData = await this.solarman.getInverterFrameData(
          record.inverter.deviceId,
          record.inverter.deviceSn,
          formattedDate,
        );

        const convertedData =
          this.convertTo15MinuteInterval(retrievedFrameData);
        const frameData = JSON.stringify(convertedData);

        if (!record.frameData || record.frameData !== frameData) {
          //;

          const formattedDate = record.collectTime.toISOString().split('T')[0];

          // //;
          // //;
          await this.prisma.inverterDailyData.update({
            where: { id: record.id },
            data: {
              frameData,
              // generation: totalGeneration / 100,
              generation: await this.solarman.getInverterTodaysGenaration(
                record.inverter.deviceId,
                record.inverter.deviceSn,
              ),
            },
          });

          // await this.prisma.inverterDailyData.update({
          //   where: { id: record.id },
          //   data: {
          //     generation: totalGeneration,
          //   },
          // });

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          //;
          //;
        }
      } else {
        // If dailyFrameData.collectTime is not today
        //;
        const formattedDate = record.collectTime.toISOString().split('T')[0];
        const retrievedFrameData = await this.solarman.getInverterFrameData(
          record.inverter.deviceId,
          record.inverter.deviceSn,
          formattedDate,
        );

        const convertedData =
          this.convertTo15MinuteInterval(retrievedFrameData);
        const frameData = JSON.stringify(convertedData);

        let totalGeneration: number = 0;
        for (const dataPoint of retrievedFrameData) {
          // //
          // //
          // //;
          totalGeneration += dataPoint.value;
        }

        // const scalingFactor = record.generation / totalGeneration;

        // Adjust the totalGeneration value using the scaling factor
        // totalGeneration *= scalingFactor;
        //;
        //;
        // //;

        //;
        //;

        if (record.frameData === frameData && record.frameData.length !== 0) {
          //;
          //;
          await this.prisma.inverterDailyData.update({
            where: { id: record.id },
            data: { updateStatus: InverterUpdateStatus.UPDATED },
          });
        } else {
          //;
          //;

          await this.prisma.inverterDailyData.update({
            where: { id: record.id },
            data: { frameData, updateStatus: InverterUpdateStatus.UPDATED },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  async delayedUpdateInverterDailyData(inverter: Inverter, delay: number) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    await this.updateInverterDailyData(inverter);
  }

  async updateInverterDailyData(inverter: Inverter) {
    // //;
    // //;
    const dailyData = await this.solarman.getInverterDailyData(
      inverter.deviceId,
      inverter.deviceSn,
    );

    // //
    // //

    // //
    // Prepare data for bulk insert
    const newDailyData = dailyData.map((data) => ({
      inverterId: inverter.id,
      collectTime: new Date(data.collectTime),
      generation: data.generation,
    }));

    // //

    // //

    // Get existing data from database
    const existingData = await this.prisma.inverterDailyData.findMany({
      where: {
        inverterId: inverter.id,
        collectTime: {
          in: newDailyData.map((data) => data.collectTime),
        },
      },
    });

    // //

    // Filter out the existing data from newDailyData
    const dataToInsert = newDailyData.filter(
      (newData) =>
        !existingData.find(
          (existingData) =>
            existingData.inverterId === newData.inverterId &&
            existingData.collectTime.getTime() ===
              newData.collectTime.getTime(),
        ),
    );

    const dataToUpdate = newDailyData
      .filter((newData) =>
        existingData.some(
          (existingData) =>
            existingData.inverterId === newData.inverterId &&
            existingData.collectTime.getTime() ===
              newData.collectTime.getTime() &&
            existingData.generation !== newData.generation,
        ),
      )
      .map((newData) => {
        const matchedData = existingData.find(
          (existingData) =>
            existingData.inverterId === newData.inverterId &&
            existingData.collectTime.getTime() ===
              newData.collectTime.getTime(),
        );
        return { ...newData, id: matchedData?.id };
      });

    // //
    // //

    // Perform bulk insert if there are new records to insert
    if (dataToInsert.length > 0) {
      await this.prisma.inverterDailyData.createMany({
        data: dataToInsert,
      });
    }

    if (dataToUpdate.length > 0) {
      //;
      //;
      // //
      for (const data of dataToUpdate) {
        await this.prisma.inverterDailyData.update({
          where: {
            // inverterId: data.inverterId,
            // collectTime: data.collectTime,
            id: data.id,
          },

          data: { generation: data.generation },
        });
      }
    }
  }

  async update(id: number, updateInverterDto: UpdateInverterDto) {
    try {
      return await this.prisma.inverter.update({
        where: { id },
        data: updateInverterDto,
      });
    } catch (error) {
      this.logger.error(
        `Error updating inverter with id: ${id}`,
        error.message,
      );
      throw new BadRequestException(error.message);
    }
  }

  async getGeneration(inverterId: number, startDate: Date, endDate: Date) {
    const generationData = await this.prisma.inverterDailyData.findMany({
      where: {
        inverterId: inverterId,
        AND: [
          {
            collectTime: {
              gte: new Date(startDate),
            },
          },
          {
            collectTime: {
              lte: new Date(endDate),
            },
          },
        ],
      },
    });

    return generationData;
  }

  private static readonly SECONDS_IN_FIFTEEN_MINUTES = 900;

  convertTo15MinuteInterval(data: { collectTime: string; value: number }[]) {
    // //
    // Step 1: Sort the data in ascending order of collectTime
    data.sort((a, b) => {
      if (parseInt(a.collectTime) > parseInt(b.collectTime)) {
        return 1;
      } else if (parseInt(a.collectTime) < parseInt(b.collectTime)) {
        return -1;
      }
      return 0;
    });

    const intervals = new Map<string, { sum: number; count: number }>();

    for (const point of data) {
      // //;
      // Convert UNIX timestamp to JavaScript Date
      const date = new Date(parseInt(point.collectTime) * 1000);

      const hour = date.getUTCHours();
      const minute = Math.floor(date.getUTCMinutes() / 15) * 15;

      const newCollectTime = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}:00`;
      const interval = intervals.get(newCollectTime) || { sum: 0, count: 0 };

      interval.sum += point.value;
      interval.count++;

      intervals.set(newCollectTime, interval);
      // //
    }

    // //;

    // Step 3 & 4: Calculate average and construct output array
    // //;

    const output = Array.from(intervals).map(
      ([collectTime, { sum, count }]) => ({
        collectTime,
        value: sum / count,
      }),
    );
    return output;
  }

  async uploadExcelData(filePath) {
    console.log('Executing uploadExcelData');
    // const filePath = '/root/monitoring_portal/solaric-monitoring-dashboard-backend/final.xlsx';
    // console.log("File Path:", filePath);
    const result = this.excelService.parseExcel(filePath);

    for (const inv of Object.keys(result)) {
      const inverter = await this.prisma.inverter.findFirst({
        where: {
          deviceSn: inv,
        },
      });

      if (!inverter) {
        console.log('Inverter not found');
        continue;
      }

      for (const date of Object.keys(result[inv])) {
        console.log(`Processing data for inverter ${inv} on ${date}`);

        const foundData = fs.readFileSync('foundData.txt', 'utf8');
        const record = `Inverter ID: ${inverter.id}, Collect Time: ${new Date(
          date,
        )}`;

        if (foundData.includes(record)) {
          console.log(`Record found in file: ${record}`);
          continue;
        }

        const inverterDailyData = await this.prisma.inverterDailyData.findFirst(
          {
            where: {
              inverterId: inverter.id,
              collectTime: new Date(date),
            },
          },
        );

        if (inverterDailyData) {
          console.log(`Found inverter daily data: ${inverterDailyData.id}`);
          fs.appendFileSync('foundData.txt', `${record}\n`);
          continue;
        }

        if (!inverterDailyData) {
          const newInverterDailyData =
            await this.prisma.inverterDailyData.create({
              data: {
                inverterId: inverter.id,
                collectTime: new Date(date),
                generation: result[inv][date],
                frameData: '[]',
                updateStatus: InverterUpdateStatus.UPDATED,
              },
            });
          console.log(
            `Created new inverter daily data: ${newInverterDailyData.id}`,
          );
        }
      }
    }
  }
}
