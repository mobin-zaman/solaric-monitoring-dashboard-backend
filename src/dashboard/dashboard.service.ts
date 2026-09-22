import {
  BadRequestException,
  ConsoleLogger,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Inverter, InverterUpdateStatus, Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as moment from 'moment';
import { type } from 'os';
import { InverterService } from 'src/inverter/inverter.service';
import { MeterService } from 'src/meter/meter.service';
import { PrismaService } from 'src/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SolarmanService } from 'src/solarman/solarman.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private meterService: MeterService, // private solarman: SolarmanServic // private inverterService: InverterService,
  ) {
    const currentDate = new Date();

    // Define the target date (May 3, 2023)
    const targetDate = new Date('2021-05-01');

    // Calculate the time difference in milliseconds for the target date
    const allTimeDiff = Math.floor(
      (currentDate.getTime() - targetDate.getTime()) / (1000 * 3600 * 24),
    );

    // Get the current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Create the start date of the current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // Calculate the time difference in milliseconds for the current month
    const monthDiff =
      Math.floor(
        (currentDate.getTime() - startOfMonth.getTime()) / (1000 * 3600 * 24),
      ) + 1;

    // Create the start date of the current year
    const startOfYear = new Date(currentYear, 0, 1);

    // Calculate the time difference in milliseconds for the current year
    const yearDiff =
      Math.floor(
        (currentDate.getTime() - startOfYear.getTime()) / (1000 * 3600 * 24),
      ) + 1;

    this.allTimeDayDiff = allTimeDiff;
    this.monthDiff = monthDiff;
    this.yearDiff = yearDiff;
  }

  private allTimeDayDiff;
  private monthDiff;
  private yearDiff;
  private ALL_PROJECT_ID = -345;

  async test() {
    // return await this.getProjectMeterHistoricView(1);
  }

  updateFrameDataArrayForToday(data) {
    // Get the current date and time
    let now = new Date();

    // Check if the collectTime in data is today
    if (new Date(data.collectTime).toDateString() === now.toDateString()) {
      // Get the current time in hours and minutes
      let currentTime = now.getHours() * 60 + now.getMinutes();

      // Update the frameDataArray
      data.frameDataArray.forEach((frameData) => {
        // Get the collectTime in the frameData in hours and minutes
        let frameDataTime = frameData.collectTime.split(':');
        let frameDataMinutes =
          parseInt(frameDataTime[0]) * 60 + parseInt(frameDataTime[1]);

        // If the frameDataTime is after the current time, remove the value
        if (frameDataMinutes > currentTime) {
          if (frameData.value) delete frameData.value;
        }
      });
    }

    return data;
  }

  async getProjectMeterHistoricView(projectId: number, collectTime: string) {
    const meters = await this.prisma.meter.findMany({
      where: {
        building: {
          company: {
            project: {
              id: projectId,
            },
          },
        },
      },
    });

    return await this.meterService.getHistoricViewData(meters, collectTime);

    // return meters;
  }

  async getCompanyMeterHistoricView(companyId: number, collectTime: string) {
    const meters = await this.prisma.meter.findMany({
      where: {
        building: {
          company: {
            id: companyId,
          },
        },
      },
    });

    return await this.meterService.getHistoricViewData(meters, collectTime);
  }

  async getBuildingMeterHistoricView(buildingId: number, collectTime: string) {
    const meters = await this.prisma.meter.findMany({
      where: {
        buildingId: buildingId,
      },
    });

    return await this.meterService.getHistoricViewData(meters, collectTime);
  }
  async getProjectHistoricView(projectId: number, collectTime: string) {
    try {
      if (projectId === this.ALL_PROJECT_ID) {
        return {
          historicalTableData: {
            production: await this.getProjectProductionMetrics(
              projectId,
              collectTime,
            ),
            sunHrs: await this.getProjectSunHours(projectId, collectTime),
            // import: meterResult.import,
            // export: meterResult.export,
          },
        };
      } else {
        const meterResult = await this.getProjectMeterHistoricView(
          projectId,
          collectTime,
        );
        return {
          historicalTableData: {
            production: await this.getProjectProductionMetrics(
              projectId,
              collectTime,
            ),
            sunHrs: await this.getProjectSunHours(projectId, collectTime),
            import: meterResult.import,
            export: meterResult.export,
          },
        };
      }
    } catch (error) {
      //;
      //;
      throw error;
    }
  }

  async getCompanyHistoricView(companyId: number, collectTime: string) {
    const meterResult = await this.getCompanyMeterHistoricView(
      companyId,
      collectTime,
    );
    return {
      historicalTableData: {
        production: await this.getCompanyProductionMetrics(
          companyId,
          collectTime,
        ),
        sunHrs: await this.getCompanySunHours(companyId, collectTime),
        import: meterResult.import,
        export: meterResult.export,
      },
    };
  }

  async getBuildingHistoricView(buildingId: number, collectTime: string) {
    try {
      const meterResult = await this.getBuildingMeterHistoricView(
        buildingId,
        collectTime,
      );
      return {
        historicalTableData: {
          production: await this.getBuildingProductionMetrics(
            buildingId,
            collectTime,
          ),
          sunHrs: await this.getBuildingSunHours(buildingId, collectTime),
          import: meterResult.import,
          export: meterResult.export,
        },
      };
    } catch (error) {
      //;
      //;
      console.log({ error });
      throw error;
    }
  }

  async getInverterHistoricView(inverterId: number, collectTime: string) {
    return {
      historicalTableData: {
        production: await this.getInverterProductionMetrics(
          inverterId,
          collectTime,
        ),
        sunHrs: await this.getInverterSunHours(inverterId, collectTime),
      },
    };
  }

  // async getProjectGenerationView() {}

  // Helper function to calculate total generation within a date range
  async calculateGeneration(
    // prisma,
    inverterIds: number[],
    start: dayjs.Dayjs,
    end?: dayjs.Dayjs,
  ) {
    const generationData = await this.prisma.inverterDailyData.aggregate({
      where: {
        inverterId: {
          in: inverterIds,
        },
        collectTime: {
          gte: start.toDate(),
          lt: end?.toDate(),
        },
      },
      _sum: {
        generation: true,
      },
    });

    const totalGeneration = generationData._sum.generation / 1_000;

    return totalGeneration;

    // return (
    //   generationData.reduce((total, data) => total + data.generation, 0) / 1_000
    // ); // convert to MWh
  }

  async getCompanyProductionMetrics(companyId: number, collectTime: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: {
        id: companyId,
      },
    });

    // Get all buildings for the given company
    const buildings = await this.prisma.building.findMany({
      where: {
        companyId: company.id,
      },
      select: {
        id: true, // we only need to select the id
      },
    });

    // Extract building ids
    const buildingIds = buildings.map((building) => building.id);

    // Get all inverters for the given buildings
    const inverters = await this.prisma.inverter.findMany({
      where: {
        buildingId: {
          in: buildingIds,
        },
      },
      select: {
        id: true, // we only need to select the id
      },
    });

    // Extract inverter ids
    const inverterIds = inverters.map((inverter) => inverter.id);

    return await this.processProductionMatrics(inverterIds, collectTime);
  }

  async processProductionMatrics(inverterIds: number[], date?: string) {
    // Define date ranges for today, this month, this year, and all time
    const todayStart = date ? dayjs(date) : dayjs().startOf('day');
    const monthStart = todayStart.startOf('month');
    const yearStart = todayStart.startOf('year');

    // Calculate total generation for today, this month, this year, and all time
    const totalGenerationToday = await this.calculateGeneration(
      inverterIds,
      todayStart,
      todayStart.add(1, 'day'),
    );
    const totalGenerationThisMonth = await this.calculateGeneration(
      inverterIds,
      monthStart,
      monthStart.add(1, 'month'),
    );
    const totalGenerationThisYear = await this.calculateGeneration(
      inverterIds,
      yearStart,
      yearStart.add(1, 'year'),
    );
    const totalGenerationAllTime = await this.calculateGeneration(
      inverterIds,
      dayjs(0),
    ); // start of UNIX time

    return {
      totalGenerationToday,
      totalGenerationThisMonth,
      totalGenerationThisYear,
      totalGenerationAllTime,
    };
  }

  async getProjectProductionMetrics(projectId: number, date: string) {
    // Get all inverters for the given project

    let inverters: any;

    if (projectId === this.ALL_PROJECT_ID) {
      inverters = await this.prisma.inverter.findMany({
        select: {
          id: true, // we only need to select the id
        },
      });

      ////;
    } else {
      inverters = await this.prisma.inverter.findMany({
        where: {
          projectId: projectId,
        },
        select: {
          id: true, // we only need to select the id
        },
      });
    }

    // Extract inverter ids
    const inverterIds = inverters.map((inverter) => inverter.id);
    // //;

    return await this.processProductionMatrics(inverterIds, date);
  }

  async getBuildingProductionMetrics(buildingId: number, date?: string) {
    // Get all inverters for the given building
    const inverters = await this.prisma.inverter.findMany({
      where: {
        buildingId: buildingId,
      },
      select: {
        id: true, // we only need to select the id
      },
    });

    // Extract inverter ids
    const inverterIds = inverters.map((inverter) => inverter.id);

    return await this.processProductionMatrics(inverterIds, date);
  }

  async getInverterProductionMetrics(inverterId: number, date?: string) {
    return await this.processProductionMatrics([inverterId], date);
  }

  //!NOTE CONSTANT DATE STRING
  getYearAndMonth(dateString) {
    let date = new Date(dateString);
    let year = date.getFullYear();
    let month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0 indexed in JS

    return [`${year}-${month}`, `${year}`];
  }

  calculateSunHours(collectTime, yearlySunHoursData, monthlySunHoursData) {
    try {
      let year = collectTime.split('-')[0];
      let month = collectTime.slice(0, 7);

      let sunHoursToday = monthlySunHoursData.find(
        (data) => data.collectTime === collectTime,
      )?.sunHours;
      let sunHoursThisMonth = yearlySunHoursData.find(
        (data) => data.collectTime === month,
      )?.sunHours;

      let yearlyData = yearlySunHoursData.filter((data) =>
        data.collectTime.startsWith(year),
      );
      let sunHoursThisYear =
        yearlyData.reduce((total, data) => total + data.sunHours, 0) /
        yearlyData.length;

      let sunHoursAllTime =
        yearlySunHoursData.reduce((total, data) => total + data.sunHours, 0) /
        yearlySunHoursData.length;

      ////;
      return {
        sunHoursToday,
        sunHoursThisMonth,
        sunHoursThisYear,
        sunHoursAllTime,
      };
    } catch (error) {
      console.log('ERROR IN CALCULATESUNHOURS');
      console.log({ collectTime });
      console.log({ error });
    }
  }

  async getProjectSunHours(projectId: number, collectTime) {
    if (projectId !== this.ALL_PROJECT_ID) {
      const project = await this.prisma.project.findUniqueOrThrow({
        where: {
          id: projectId,
        },
        include: {
          inverters: {
            select: {
              capacity: true,
              id: true,
            },
          },
        },
      });
    }

    const [month, year] = this.getYearAndMonth(collectTime);

    // //;

    const monthlySunHoursData = await this.getProjectSunHoursBargraphData(
      projectId,
      month,
    );

    const yearlySunHoursData = await this.getProjectSunHoursBargraphData(
      projectId,
      year,
    );

    // ('DEBUGGING====>');
    // //;
    // //;
    // //;

    return this.calculateSunHours(
      collectTime,
      yearlySunHoursData,
      monthlySunHoursData,
    );
  }

  async getCompanySunHours(companyId: number, collectTime) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: {
        id: companyId,
      },
      include: {
        buildings: {
          select: {
            inverters: {
              select: {
                id: true,
                capacity: true,
              },
            },
          },
        },
      },
    });

    const [month, year] = this.getYearAndMonth(collectTime);

    const monthlySunHoursData = await this.getCompanySunHoursBargraphData(
      companyId,
      month,
    );
    const yearlySunHoursData = await this.getCompanySunHoursBargraphData(
      companyId,
      year,
    );

    return this.calculateSunHours(
      collectTime,
      yearlySunHoursData,
      monthlySunHoursData,
    );
  }

  async getBuildingSunHours(buildingId: number, collectTime) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: {
        id: buildingId,
      },
      include: {
        inverters: {
          select: {
            id: true,
            capacity: true,
          },
        },
      },
    });

    const [month, year] = this.getYearAndMonth(collectTime);

    const monthlySunHoursData = await this.getBuildingSunHoursBargraphData(
      buildingId,
      month,
    );
    const yearlySunHoursData = await this.getBuildingSunHoursBargraphData(
      buildingId,
      year,
    );

    return this.calculateSunHours(
      collectTime,
      yearlySunHoursData,
      monthlySunHoursData,
    );
  }

  async getInverterSunHours(inverterId: number, collectTime) {
    const inverter = await this.prisma.inverter.findUniqueOrThrow({
      where: {
        id: inverterId,
      },
      select: {
        id: true,
        capacity: true,
      },
    });

    const [month, year] = this.getYearAndMonth(collectTime);

    const monthlySunHoursData = await this.getInverterSunHoursBargraphData(
      inverterId,
      month,
    );
    const yearlySunHoursData = await this.getInverterSunHoursBargraphData(
      inverterId,
      year,
    );

    return this.calculateSunHours(
      collectTime,
      yearlySunHoursData,
      monthlySunHoursData,
    );
  }

  //     // Calculate the total capacity of all inverters

  async getMonthlySunHoursData(inverters) {
    // //;
    // Fetch project's inverters and their daily data
    // Calculate the total capacity of all inverters
    const totalCapacity = inverters.reduce(
      (total, inverter) => total + (inverter.capacity ?? 0),
      0,
    );
    // Group daily data by month and year, and calculate sun hours for each day
    const monthlySunHoursData = inverters
      .flatMap((inverter) => inverter.dailyData)
      .reduce((result, data) => {
        const yearMonthKey = `${data.collectTime.getFullYear()}-${
          data.collectTime.getMonth() + 1
        }`;
        const day = data.collectTime.getDate();
        // const sunHours = data.generation / totalCapacity;

        if (!result[yearMonthKey]) {
          result[yearMonthKey] = [];
        }

        // Check if the day is already present in the array
        const existingDay = result[yearMonthKey].find(
          (item) => item.day === day,
        );

        if (existingDay) {
          // Add the sun-hours to the existing day
          existingDay.generation += data.generation;
        } else {
          // Add a new entry for the day
          result[yearMonthKey].push({ day, generation: data.generation });
        }

        return result;
      }, {} as Record<string, { day: number; sunHours: number }[]>);

    for (const month in monthlySunHoursData) {
      for (let i = 0; i < monthlySunHoursData[month].length; i++) {
        const dayData = monthlySunHoursData[month][i];
        dayData.sunHours = dayData.generation / totalCapacity;
        delete dayData.generation;
      }
      monthlySunHoursData[month].sort((a, b) => a.day - b.day);
    }

    return monthlySunHoursData;
  }

  async getYearlySunHoursData(inverters, collectTime) {}

  getLastDayOfMonth(dateString) {
    const date = new Date(dateString);

    const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return result;
  }

  calculateAvgSunHours(sunHoursData) {
    const avgSunHours =
      sunHoursData.reduce((total, data) => {
        return total + data.sunHours;
      }, 0) / sunHoursData.length;
    return avgSunHours;
  }

  appendAvgSunHoursWithSunHoursData(sunHoursData) {
    return {
      sunHoursData,
      avgSunHours: this.calculateAvgSunHours(sunHoursData),
    };
  }

  async getProjectSunHoursBargraphData(projectId: number, collectTime: string) {
    console.log('EXECUTING GET PROJECT SUN HOURS BAR GRAPH DATA');
    // returnl this.getProjectMonthlySunHoursData(projectId)
    // return this.getProjectYearlySunHoursData(projectId);
    // //
    let inverters: any;

    if (projectId === this.ALL_PROJECT_ID) {
      inverters = await this.prisma.inverter.findMany({
        include: {
          dailyData: true,
        },
      });
    } else {
      inverters = await this.prisma.inverter.findMany({
        where: {
          projectId,
        },
        include: {
          dailyData: true,
        },
      });
    }
    const result = await this.processSunHoursBarGraphData(
      inverters,
      collectTime,
    );
    return result;
    // return this.appendAvgSunHoursWithSunHoursData(result);
    // monthly: await this.getMonthlySunHoursData(inverters),
    // yearly: await this.getYearlySunHoursData(inverters),
  }

  async getCompanySunHoursBargraphData(companyId: number, collectTime: string) {
    const inverters = await this.prisma.inverter.findMany({
      where: {
        building: {
          company: {
            id: companyId,
          },
        },
      },
      include: {
        dailyData: true,
      },
    });

    const result = await this.processSunHoursBarGraphData(
      inverters,
      collectTime,
    );
    return result;
    // return this.appendAvgSunHoursWithSunHoursData(result);
  }

  async getBuildingSunHoursBargraphData(
    buildingId: number,
    collectTime: string,
  ) {
    const inverters = await this.prisma.inverter.findMany({
      where: {
        buildingId: buildingId,
      },
      include: {
        dailyData: true,
      },
    });
    console.log(
      '🚀 ~ file: dashboard.service.ts:715 ~ DashboardService ~ inverters:',
      inverters,
    );

    return this.processSunHoursBarGraphData(inverters, collectTime);
  }

  async getInverterSunHoursBargraphData(
    inverterId: number,
    collectTime: string,
  ) {
    const inverter = await this.prisma.inverter.findUnique({
      where: {
        id: inverterId,
      },
      include: {
        dailyData: true,
      },
    });

    return this.processSunHoursBarGraphData([inverter], collectTime);
  }

  async processMonthlySunHoursBarGraphData(inverters, collectTime) {
    console.log('EXECUTING PROCESS MONTHLY SUN HOURS BAR GRAPH DATA');
    function compareDates(date1, date2) {
      const [year1, month1] = date1.split('-');
      const [year2, month2] = date2.split('-');

      const jsDate1 = new Date(parseInt(year1), parseInt(month1) - 1);
      const jsDate2 = new Date(parseInt(year2), parseInt(month2) - 1);

      return (
        jsDate1.getMonth() === jsDate2.getMonth() &&
        jsDate1.getFullYear() === jsDate2.getFullYear()
      );
    }

    function getModifiedArray(collectTime, data) {
      // //
      // //
      for (const key of Object.keys(data)) {
        const result = compareDates(key, collectTime);
        if (result) {
          // //
          return data[key].map((entry) => ({
            collectTime: `${collectTime}-${entry.day
              .toString()
              .padStart(2, '0')}`,
            sunHours: entry.sunHours,
          }));
        }
      }
    }

    // let endOfTheMonth = this.getLastDayOfMonth(collectTime);
    //!NOTE: DON"T CHANGE THE BELOW DATES, ITS CORRESPONDS TO FIRST INVERTERS CREATED
    //!NOTE: Changing currently for the bugs.
    // if (new Date(collectTime) <= new Date('2023-10')) {
    //   endOfTheMonth = this.getLastDayOfMonth('2023-11');
    //   //!CHANGING COLLECTTIME LED TO SOLUTION
    //   collectTime = '2023-10';
    // }

    // const selectedInverters = inverters.filter((item) => {
    //   return item.createdAt <= endOfTheMonth;
    // });
    // const selectedInverters = inverters.filter((item) => {
    //   const dateParts = collectTime.split('-');
    //   const year = Number(dateParts[0]);
    //   // console.log("🚀 ~ file: dashboard.service.ts:787 ~ DashboardService ~ selectedInverters ~ year:", year)
    //   const month = Number(dateParts[1]);
    //   // console.log("🚀 ~ file: dashboard.service.ts:789 ~ DashboardService ~ selectedInverters ~ month:", month)

    //   // Use Prisma's `some` operator to check if any daily data records
    //   // for the inverter match the desired year and month
    //   return item.dailyData.some(data => {
    //     console.log("��� ~ file: dashboard.service.ts:793 ~ DashboardService ~data.collectTime:", data.collectTime);
    //     const dataYear = data.collectTime.getYear();
    //     console.log("🚀 ~ file: dashboard.service.ts:793 ~ DashboardService ~ selectedInverters ~ dataYear:", dataYear)
    //     const dataMonth = data.collectTime.getMonth() + 1; // Months are zero-indexed
    //     console.log("🚀 ~ file: dashboard.service.ts:795 ~ DashboardService ~ selectedInverters ~ dataMonth:", dataMonth)
    //     return dataYear === year && dataMonth === month;
    //   });

    // })
    const selectedInverters = inverters.filter(async (item) => {
      // console.log("🚀 ~ file: dashboard.service.ts:804 ~ DashboardService ~ selectedInverters ~ item:", item)
      const dateParts = collectTime.split('-');
      const year = Number(dateParts[0]);
      const month = Number(dateParts[1]);

      return item.dailyData.some((data) => {
        return (
          data.collectTime.getYear() === year &&
          data.collectTime.getMonth() === month
        );
      });
    });
    // //;

    const monthly = await this.getMonthlySunHoursData(selectedInverters);
    // //;
    // return monthly.length;;
    const result = getModifiedArray(collectTime, monthly);
    return result;
  }
  async processYearlySunHoursBarGraphData(inverters, collectTime) {
    function generateDateStrings() {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      //!NOTE: DON"T CHANGE THE BELOW DATES, ITS CORRESPONDS TO INITIALLY CREATED INVERTERS
      //!NOTE: CONVERT BELOW VALUES TO ENV VARIABLE

      const startYear = 2021;
      const startMonth = 1;
      const dateStrings = [];

      for (let year = startYear; year <= currentYear; year++) {
        const endMonth = year === currentYear ? currentMonth : 12;

        for (let month = startMonth; month <= endMonth; month++) {
          const dateString = `${year}-${month.toString().padStart(2, '0')}`;
          dateStrings.push(dateString);
        }

        // startMonth = 1;
      }

      return dateStrings;
    }

    const dateStrings = generateDateStrings();

    const result = [];

    for (const date of dateStrings) {
      const monthlySunHours = await this.processMonthlySunHoursBarGraphData(
        inverters,
        date,
      );
      // console.log("🚀 ~ file: dashboard.service.ts:819 ~ DashboardService ~ processYearlySunHoursBarGraphData ~ inverters:", inverters)

      // ;

      // //;
      // //;

      if (monthlySunHours) {
        const totalSunHours = monthlySunHours.reduce(
          (total, entry) => total + entry.sunHours,
          0,
        );
        // //;
        const sunHours = totalSunHours / monthlySunHours.length;

        result.push({
          collectTime: date,
          sunHours,
        });
      } else {
        result.push({
          collectTime: date,
        });
      }
    }

    function filterObjectsByYear(objects, year) {
      return objects.filter((object) => object.collectTime.startsWith(year));
    }

    return filterObjectsByYear(result, collectTime);

    // return result;

    // const yearlyData = await this.getYearlySunHoursData(inverters, collectTime);
    // return yearlyData[collectTime];
  }
  async processSunHoursBarGraphData(inverters, collectTime: string) {
    // //;
    const monthlyRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    const yearlyRegex = /^\d{4}$/;

    if (monthlyRegex.test(collectTime)) {
      return await this.processMonthlySunHoursBarGraphData(
        inverters,
        collectTime,
      );
    } else if (yearlyRegex.test(collectTime)) {
      return await this.processYearlySunHoursBarGraphData(
        inverters,
        collectTime,
      );
    } else {
      throw new BadRequestException(
        'time format should be YYYY-MM for monthly and YYYY for yearly',
      );
    }
  }

  async getMonthlyGeneration(inverters) {
    // Group daily data by month and year, and calculate generation for each day
    const monthlyGenerationData = inverters
      .flatMap((inverter) => inverter.dailyData)
      .reduce((result, data) => {
        const yearMonthKey = `${data.collectTime.getFullYear()}-${
          data.collectTime.getMonth() + 1
        }`;
        const day = data.collectTime.getDate();
        const generation = data.generation;

        if (!result[yearMonthKey]) {
          result[yearMonthKey] = [];
        }

        // Check if the day is already present in the array
        const existingDay = result[yearMonthKey].find(
          (item) => item.day === day,
        );

        if (existingDay) {
          // Add the generation to the existing day
          existingDay.generation += generation;
        } else {
          // Add a new entry for the day
          result[yearMonthKey].push({ day, generation });
        }

        return result;
      }, {} as Record<string, { day: number; generation: number }[]>);

    return monthlyGenerationData;
  }

  async getYearlyGeneration(inverters: any[]) {
    // Group daily data by year and month, and calculate generation for each month
    const yearlyGenerationData = inverters
      .flatMap((inverter) => inverter.dailyData)
      .reduce((result, data) => {
        const year = data.collectTime.getFullYear();
        const month = data.collectTime.toLocaleString('default', {
          month: 'short',
        });
        const generation = data.generation;

        if (!result[year]) {
          result[year] = [];
        }

        // Check if the month is already present in the array
        const existingMonth = result[year].find((item) => item.month === month);

        if (existingMonth) {
          // Add the generation to the existing month
          existingMonth.generation += generation;
        } else {
          // Add a new entry for the month
          result[year].push({ month, generation });
        }

        return result;
      }, {} as Record<string, { month: string; generation: number }[]>);

    return yearlyGenerationData;
  }

  async getProjectEnvironmentImpact(projectId: number, date: string) {
    let inverters: any;
    let tarrif: any;
    let dollarRate: any;
    if (projectId === this.ALL_PROJECT_ID) {
      // //;

      dollarRate = 110;
      tarrif = 10;

      inverters = await this.prisma.inverter.findMany({
        select: {
          id: true,
        },
      });
    } else {
      const project = await this.prisma.project.findUniqueOrThrow({
        where: {
          id: projectId,
        },
      });
      inverters = await this.prisma.inverter.findMany({
        where: {
          projectId: project.id,
        },
        select: {
          id: true,
        },
      });

      dollarRate = project.dollarRate;
      tarrif = project.tarrif;
    }

    const inverterIds = inverters.map((item) => item.id);

    return this.calculateEnvironmentImpact(
      inverterIds,
      date,
      tarrif,
      dollarRate,
    );
  }

  async getCompanyEnvironmentImpact(companyId: number, collectTime: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: {
        id: companyId,
      },
      include: {
        project: true,
      },
    });

    const inverters = await this.prisma.inverter.findMany({
      where: {
        building: {
          company: {
            id: company.id,
          },
        },
      },
    });

    const inverterIds = inverters.map((item) => item.id);

    return this.calculateEnvironmentImpact(
      inverterIds,
      collectTime,
      company.project.tarrif,
      company.project.dollarRate,
    );
  }

  async getBuildingEnvironmentImpact(buildingId: number, collectTime: string) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: {
        id: buildingId,
      },
      include: {
        company: true,
      },
    });

    const inverters = await this.prisma.inverter.findMany({
      where: {
        buildingId: building.id,
      },
    });

    const company = await this.prisma.company.findUniqueOrThrow({
      where: {
        id: building.company.id,
      },
      include: {
        project: true,
      },
    });

    const inverterIds = inverters.map((item) => item.id);
    // return this.calculateEnvironmentImpact(inverters);
    return this.calculateEnvironmentImpact(
      inverterIds,
      collectTime,
      company.project.tarrif,
      company.project.dollarRate,
    );
  }

  async getInverterEnvironmentImpact(inverterId: number, collectTime: string) {
    const inverter = await this.prisma.inverter.findUnique({
      where: {
        id: inverterId,
      },
      include: {
        project: true,
      },
    });

    return this.calculateEnvironmentImpact(
      [inverter.id],
      collectTime,
      inverter.project.tarrif,
      inverter.project.dollarRate,
    );
  }

  async calculateEnvironmentImpact(
    inverterIds: number[],
    date: string,
    tarrif: number,
    dollarRate: number,
  ) {
    // Define date ranges for today, this month, and this year
    const todayStart = date ? dayjs(date) : dayjs().startOf('day');
    const monthStart = todayStart.startOf('month');
    const yearStart = todayStart.startOf('year');

    let totalGeneration = 0;
    // //

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Date format: 'YYYY-MM-DD'
      totalGeneration = await this.calculateGeneration(
        inverterIds,
        todayStart,
        todayStart.add(1, 'day'),
      );
    } else if (/^\d{4}-\d{2}$/.test(date)) {
      // Date format: 'YYYY-MM'
      totalGeneration = await this.calculateGeneration(
        inverterIds,
        monthStart,
        monthStart.add(1, 'month'),
      );
    } else {
      // Date format: 'YYYY'
      totalGeneration = await this.calculateGeneration(
        inverterIds,
        yearStart,
        yearStart.add(1, 'year'),
      );
    }

    const totalGenerationInKWh = totalGeneration * 1000;

    // Calculate CO₂ Emission Reduction (t)
    const co2EmissionReduction = 0.000793 * totalGenerationInKWh;

    // Calculate Trees Planted
    const treesPlanted = (totalGenerationInKWh * 0.997) / 18.3;

    // //
    const moneySaved = (totalGeneration * tarrif) / dollarRate;

    // //;

    return { co2EmissionReduction, treesPlanted, moneySaved };
  }

  async getInverterFrameData(inverterId: number, collectTime) {
    // Assuming you have a Prisma Client instantiated and imported as 'prisma'
    // //;
    const inverter = await this.prisma.inverter.findUniqueOrThrow({
      where: {
        id: inverterId,
      },
    });

    const today = new Date(collectTime);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dailyData = await this.prisma.inverterDailyData.findFirst({
      where: {
        inverterId: inverter.id,
        collectTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        inverter: true,
      },
    });

    //

    // //;

    if (!dailyData || !dailyData.frameData) {
      return null;
    }

    // const totalGeneration =/d

    let baseFrameData;
    try {
      // //
      baseFrameData = JSON.parse(dailyData.frameData);

      const frameDataArray = baseFrameData.map((item) => {
        return {
          collectTime: item.collectTime,
          value: item.value,
        };
      });

      // Assuming the frameDataArray is already defined

      // Get the index of the last element with a valid collectTime

      // //;
      // //;
      // //;
      // //;
      // //;
      // //lsof -t -i :3178 | xargs kill
      // //;
      // const sunHrs= dailyData.generation ? (dailyData.generation / inverter.capacity): 0;
      let sunHrs = 0;
      if (dailyData.generation !== 0 && inverter.capacity) {
        sunHrs = dailyData.generation / inverter.capacity;
      }
      // console./log({ sunHrs });
      if (sunHrs === Infinity) {
        ////;
        ////;
        ////;
        ////;
      }

      return {
        frameDataArray,
        // frameDataArrayProcessed,
        generation: dailyData.generation / 1000,
        sunHrs,
      };
    } catch (e) {
      console.error('Error parsing frameData: ', e);
      return null;
    }
  }

  async getInverterCollectTimes(inverterId: number): Promise<string[]> {
    const dailyData = await this.prisma.inverterDailyData.findMany({
      where: {
        inverterId: inverterId,
        // frameData: {
        //   not: null,
        // },
      },
      distinct: ['collectTime'],
      select: { collectTime: true },
      orderBy: { collectTime: 'asc' },
    });

    const collectTimes = dailyData.map((data) => {
      const date = data.collectTime;
      return `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    });

    return collectTimes;
  }

  consolidateDataIntoIntervals(data, intervalInMinutes) {
    // Initialize empty object to hold consolidated data
    let consolidatedData = [];

    // Go through each data point
    for (let dataPoint of data) {
      // Calculate the time in minutes of this data point
      let [hours, minutes, seconds] = dataPoint.collectTime
        .split(':')
        .map(Number);
      let timeInMinutes = hours * 60 + minutes + seconds / 60;

      // Calculate the interval index of this data point
      let intervalIndex = Math.floor(timeInMinutes / intervalInMinutes);

      // Format the interval index as a time string
      let intervalHours = Math.floor((intervalIndex * intervalInMinutes) / 60);
      let intervalMinutes = (intervalIndex * intervalInMinutes) % 60;
      let intervalTimeString = `${String(intervalHours).padStart(
        2,
        '0',
      )}:${String(intervalMinutes).padStart(2, '0')}:00`;

      // If this interval doesn't exist in the consolidated data, create it
      if (!(intervalTimeString in consolidatedData)) {
        consolidatedData[intervalTimeString] = 0;
      }

      // Add the value of this data point to the total for its interval
      consolidatedData[intervalTimeString] += dataPoint.value / 1000;
    }

    // Convert the consolidated data object to an array
    consolidatedData = Object.entries(consolidatedData).map(
      ([collectTime, value]) => ({ collectTime, value }),
    );

    // Sort the consolidated data array by collectTime
    // consolidatedData.sort((a, b) => a.collectTime.localeCompare(b.collectTime));

    return consolidatedData;
  }

  async getBuildingFrameData(buildingId: number, collectTime: string) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: {
        id: buildingId,
      },
    });

    const inverters = await this.prisma.inverter.findMany({
      where: {
        buildingId: building.id,
      },
      select: {
        id: true,
        capacity: true,
      },
    });

    // //;

    const result = await this.processInverterFrameDatas(inverters, collectTime);

    const { sunHoursToday } = await this.getBuildingSunHours(
      buildingId,
      collectTime,
    );

    const result2 = { ...result, sunHrs: sunHoursToday };
    return this.updateFrameDataArrayForToday(result2);
    // return this.inverterService.convertTo15MinuteInterval(combinedFrameDataArray as any);
  }

  async getBuildingCollectTimes(buildingId: number): Promise<string[]> {
    const dailyData = await this.prisma.inverterDailyData.findMany({
      where: {
        inverter: { buildingId: buildingId },
        // frameData: {
        //   not: null,
        // },
      },
      distinct: ['collectTime'],
      select: { collectTime: true },
      orderBy: { collectTime: 'asc' },
    });

    const collectTimes = dailyData.map((data) => {
      const date = data.collectTime;
      return `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    });

    return collectTimes;
  }

  async getCompanyFrameData(companyId: number, collectTime: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: {
        id: companyId, // replace with the actual company id
      },
      select: {
        buildings: {
          select: {
            inverters: {
              select: {
                id: true,
                capacity: true,
              },
            },
          },
        },
      },
    });

    const inverters = company.buildings.flatMap(
      (building) => building.inverters,
    );

    ////;
    ////;

    const result = await this.processInverterFrameDatas(inverters, collectTime);

    const { sunHoursToday } = await this.getCompanySunHours(
      companyId,
      collectTime,
    );

    const result2 = { ...result, sunHrs: sunHoursToday };
    return this.updateFrameDataArrayForToday(result2);
  }

  async getCompanyCollectTimes(companyId: number): Promise<string[]> {
    const dailyData = await this.prisma.inverterDailyData.findMany({
      where: {
        inverter: { building: { companyId: companyId } },
        // frameData: {
        //   not: null,
        // },
      },
      distinct: ['collectTime'],
      select: { collectTime: true },
      orderBy: { collectTime: 'asc' },
    });

    const collectTimes = dailyData.map((data) => {
      const date = data.collectTime;
      return `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    });

    return collectTimes;
  }

  async getProjectFrameData(projectId: number, collectTime: string) {
    let inverters: any;
    if (projectId === this.ALL_PROJECT_ID) {
      inverters = await this.prisma.inverter.findMany({
        select: {
          id: true,
          capacity: true,
        },
      });
    } else {
      const project = await this.prisma.project.findUniqueOrThrow({
        where: {
          id: projectId,
        },
      });

      inverters = await this.prisma.inverter.findMany({
        where: {
          projectId: project.id,
        },
        select: {
          id: true,
          capacity: true,
        },
      });
    }

    const result = await this.processInverterFrameDatas(inverters, collectTime);
    // / {...result, sunHrs: this.getPr}
    const { sunHoursToday } = await this.getProjectSunHours(
      projectId,
      collectTime,
    );

    const result2 = { ...result, sunHrs: sunHoursToday };
    return this.updateFrameDataArrayForToday(result2);
  }

  async getProjectCollectTimes(projectId: number): Promise<string[]> {
    let dailyData: any;

    if (projectId === this.ALL_PROJECT_ID) {
      dailyData = await this.prisma.inverterDailyData.findMany({
        distinct: ['collectTime'],
        select: { collectTime: true },
        orderBy: { collectTime: 'desc' },
      });
    } else {
      dailyData = await this.prisma.inverterDailyData.findMany({
        where: {
          inverter: { projectId: projectId },
          // frameData: {
          //   not: null,
          // },
        },
        distinct: ['collectTime'],
        select: { collectTime: true },
        orderBy: { collectTime: 'desc' },
      });
    }

    const collectTimes = dailyData.map((data) => {
      const date = data.collectTime;
      return `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    });

    return collectTimes;
  }

  fillMissingTimes(data) {
    // Define the start and end times
    let start = new Date();
    start.setHours(4, 0, 0, 0);
    let end = new Date();
    end.setHours(20, 0, 0, 0);

    // Create an array of 15-minute intervals between the start and end times
    let times = [];
    for (
      let time = start;
      time.getTime() <= end.getTime();
      time.setMinutes(time.getMinutes() + 15)
    ) {
      let hours = time.getHours();
      let minutes: any = time.getMinutes();
      hours = hours % 24;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      let collectTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:00`;

      // Check if this time already exists in the data
      let existingEntry = data.frameDataArray.find((entry) => {
        // console.log(entry);
        const result = entry.collectTime === collectTime;
        // console.log("entry.collectTime: ", entry.collectTime);
        // console.log({collectTime})
        // console.log({result});
        return result;
      });

      if (existingEntry) {
        // If it exists, use the existing entry
        times.push(existingEntry);
      } else {
        // If it doesn't exist, create a new entry without a value
        times.push({ collectTime });
      }
    }

    // Sort by time
    // times.sort((a, b) => new Date(`1970/01/01 ${a.collectTime}`).getTime() - new Date(`1970/01/01 ${b.collectTime}`).getTime());

    return times;
  }

  //* start of the util functions for calculating generation

  // }
  async processInverterFrameDatas(
    inverters: { id: number; capacity: number }[],
    collectTime: string,
  ) {
    const sortedInverterKeys = inverters.map((i) => i.id);
    sortedInverterKeys.sort((a, b) => a - b);
    const cacheKey = `${collectTime}_${sortedInverterKeys}`;
    //
    // //
    // //
    // //

    // const cacheValue = await this.cacheManager.get(cacheKey);
    const cacheValue = await this.prisma.inverterFrameDataCache.findFirst({
      where: {
        cacheKey,
      },
    });

    if (cacheValue) {
      // return this.fillMissingTimes(JSON.parse(cacheValue.data));
      const value = JSON.parse(cacheValue.data);
      // const withMissingValue = this.fillMissingTimes(value);
      // return {frameDataArray: withMissingValue}
      return value;
    }

    // if (JSON.parse(cacheValue.data).frameDataArray?.length === 0) {
    //   ////;
    //   // //
    //   return JSON.parse(cacheValue.data);
    // }

    let combinedFrameData = {};
    let combinedCapacityData = 0;

    let startDate = dayjs(collectTime);
    let endDate = startDate.add(1, 'day');

    const inverterIds = inverters.map((inverter) => inverter.id);

    let combinedGenerationData = await this.calculateGeneration(
      inverterIds,
      startDate,
      endDate,
    );

    for (let inverter of inverters) {
      const inverterFrameDataResult = await this.getInverterFrameData(
        inverter.id,
        collectTime,
      );

      if (inverterFrameDataResult && inverterFrameDataResult.frameDataArray) {
        combinedCapacityData += inverter.capacity ? inverter.capacity : 0;

        for (let entry of inverterFrameDataResult.frameDataArray) {
          let { collectTime, value } = entry;
          if (combinedFrameData[collectTime]) {
            combinedFrameData[collectTime] += value;
          } else {
            combinedFrameData[collectTime] = value;
          }
        }
      }
    }

    const combinedFrameDataArray = Object.entries(combinedFrameData).map(
      ([collectTime, value]) => ({ collectTime, value }),
    );

    let frameDataArray = this.consolidateDataIntoIntervals(
      combinedFrameDataArray,
      15,
    );

    function removeInconsistentDataPoints(frameDataArray) {
      // const frameDataArray = data.data.frameDataArray;

      for (let i = 1; i < frameDataArray.length - 1; i++) {
        const currentData = frameDataArray[i];
        const previousData = frameDataArray[i - 1];
        const nextData = frameDataArray[i + 1];

        // Check if currentData is inconsistent with previousData or nextData
        if (
          (previousData.value === 0 && nextData.value === 0) ||
          (previousData.value !== 0 &&
            currentData.value === 0 &&
            nextData.value !== 0)
        ) {
          frameDataArray.splice(i, 1); // Remove the inconsistent data point
          i--; // Adjust the index since the array length has changed
        }
      }

      // const result =  this.fillMissingTimes(frameDataArray);
      // return {frameDataArray: result};
      return frameDataArray;
    }

    function sortByCollectTime(data) {
      const frameDataArray = data.data.frameDataArray;

      frameDataArray.sort((a, b) => {
        const timeA = a.collectTime;
        const timeB = b.collectTime;

        if (timeA < timeB) {
          return -1;
        }

        if (timeA > timeB) {
          return 1;
        }

        return 0;
      });

      data.data.frameDataArray = frameDataArray;

      return data;
    }
    // Usage:
    frameDataArray.forEach((frameData) => {
      const [hour, minute, second] = frameData.collectTime.split(':');
      let collectTime: any = new Date(
        Date.UTC(2023, 5, 1, hour, minute, second),
      );
      collectTime.setUTCHours(collectTime.getUTCHours() + 7);
      collectTime = collectTime.toISOString().substr(11, 8);
      frameData.collectTime = collectTime;
    });

    // Sort frameDataArray by collectTime in ascending order
    frameDataArray.sort((a, b) => {
      if (a.collectTime < b.collectTime) return -1;
      if (a.collectTime > b.collectTime) return 1;
      return 0;
    });
    frameDataArray.sort((a, b) => a.collectTime.localeCompare(b.collectTime));

    // const modifiedFrameData = this.fillMissingTimes({frameDataArray});

    const result = {
      collectTime,
      generation: combinedGenerationData,
      // sunHrs: combinedGenerationData / (combinedCapacityData / 1000),
      combinedCapacityData,
      // frameDataArray: removeInconsistentDataPoints(frameDataArray),
      // frameDataArray: this.fillMissingTimes(frameDataArray),
      frameDataArray,
      // frameDataArray: modifiedFrameData
      // frameDataArray : sortedData
    };

    // Store the result in the cache if collectTime is today
    if (!dayjs(collectTime).isSame(dayjs(), 'day')) {
      ////;

      const cachePresent = await this.prisma.inverterFrameDataCache.findFirst({
        where: {
          cacheKey: cacheKey,
        },
      });

      if (cachePresent) {
        await this.prisma.inverterFrameDataCache.delete({
          where: {
            cacheKey: cacheKey,
          },
        });
      }

      if (result.frameDataArray.length > 0) {
        await this.prisma.inverterFrameDataCache.create({
          data: {
            cacheKey,
            data: JSON.stringify(result),
          },
        });
      }
    } else {
      ////;
      ////;
    }

    return result;
  }

  //*end of the util function for calculating generation

  // async calculatePeakPowerFromInverters(inverters, filteredCollectTimes) {
  //   let combinedPowers = [];
  //   for (const date of filteredCollectTimes) {
  //     const frameDataResult = await this.processInverterFrameDatas(
  //       inverters,
  //       date,
  //     );
  //     // //
  //     combinedPowers.push(frameDataResult);
  //   }

  //   // //

  //   const result = combinedPowers.map((item) => {
  //     const { collectTime, frameDataArray } = item;
  //     const peakPower = Math.max(...frameDataArray.map((frame) => frame.value));
  //     return { collectTime, peakPower };
  //   });

  //   return result;
  // }

  async calculatePeakPowerFromInverters(inverters, filteredCollectTimes) {
    try {
      const promises = filteredCollectTimes.map((date) =>
        this.processInverterFrameDatas(inverters, date),
      );
      const combinedPowers = await Promise.all(promises);

      const result = combinedPowers.map((item) => {
        const { collectTime, frameDataArray } = item;
        const peakPower = Math.max(
          ...frameDataArray.map((frame) => frame.value),
        );
        return { collectTime, peakPower };
      });

      return result;
    } catch (error) {
      console.error(error);
      // Handle error here
    }
  }

  async getMonthlyPeakPower(inverters, monthString, possibleCollectTimes) {
    // const date = new Date(monthString);
    // //

    // //

    //dates which starts with the month
    const filteredDates = possibleCollectTimes.filter((date) =>
      date.startsWith(monthString),
    );

    return await this.calculatePeakPowerFromInverters(inverters, filteredDates);

    // //
  }

  async getYearlyPeakPower(inverters, yearString, possibleCollectTimes) {
    const filteredDates = possibleCollectTimes.filter((date) =>
      date.startsWith(yearString),
    );

    // //;

    const uniqueMonths = [
      ...new Set(filteredDates.map((date) => date.slice(0, 7))),
    ];

    // //;

    // let combinedResults = {};
    let result = [];
    for (const monthString of uniqueMonths) {
      const peakPowerResults = await this.getMonthlyPeakPower(
        inverters,
        monthString,
        possibleCollectTimes,
      );
      const higestMonthlyPeakPower = Math.max(
        ...peakPowerResults.map((item) => item.peakPower),
      );

      // combinedResults[monthString as any] = higestMonthlyPeakPower;
      result.push({
        collectTime: monthString,
        peakPower: higestMonthlyPeakPower,
      });
    }

    return result;
  }

  async processPeakPowersFromInverters(
    inverters: Inverter[],
    collectTime,
    possibleCollectTimes,
  ) {
    let peakPowers = {};

    // const dates = await this.retriveCollectTimesForPeakPower(inverters);
    // return dates;

    // const compiledData = await this.compileFrameDataForInverters()
    const monthlyRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    const yearlyRegex = /^\d{4}$/;

    if (monthlyRegex.test(collectTime)) {
      // collectionTime is in the format 'YYYY-MM'

      const result = await this.getMonthlyPeakPower(
        inverters,
        collectTime,
        possibleCollectTimes,
      );
      return result;
    } else if (yearlyRegex.test(collectTime)) {
      // collectionTime is in the format 'YYYY'
      const result = await this.getYearlyPeakPower(
        inverters,
        collectTime,
        possibleCollectTimes,
      );
      return result;
    } else {
      throw new BadRequestException(
        'time format should be YYYY-MM for monthly and YYYY for yearly',
      );
    }
  }

  async compileFrameDataForInverters(dates, inverters: Inverter[]) {
    let compiledFrameData = [];

    for (const date of dates) {
      ////;
      const result = await this.processInverterFrameDatas(inverters, date);
      compiledFrameData.push(result);
    }

    return compiledFrameData;
  }

  async getPeakPowerForProject(projectId: number, collectTime: string) {
    // Fetch inverters for this project
    if (projectId === this.ALL_PROJECT_ID) {
      const inverters = await this.prisma.inverter.findMany({});

      const possibleCollectTimes = await this.getProjectCollectTimes(
        this.ALL_PROJECT_ID,
      );

      // Extract inverter IDs
      // const inverterIds = inverters.map((inverter) => inverter.id);

      // Get peak powers for these inverters
      return await this.processPeakPowersFromInverters(
        inverters,
        collectTime,
        possibleCollectTimes,
      );
    } else {
      const project = await this.prisma.project.findUniqueOrThrow({
        where: {
          id: projectId,
        },
      });
      const inverters = await this.prisma.inverter.findMany({
        where: { projectId: project.id },
      });

      const possibleCollectTimes = await this.getProjectCollectTimes(1);

      // Extract inverter IDs
      // const inverterIds = inverters.map((inverter) => inverter.id);

      // Get peak powers for these inverters
      return await this.processPeakPowersFromInverters(
        inverters,
        collectTime,
        possibleCollectTimes,
      );
    }
  }

  async getPeakPowerForCompany(companyId: number, collectTime: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: {
        id: companyId,
      },
    });
    // Fetch buildings for this company
    const buildings = await this.prisma.building.findMany({
      where: { companyId: company.id },
    });

    // Fetch inverters for these buildings
    const inverters = [];
    for (let building of buildings) {
      const buildingInverters = await this.prisma.inverter.findMany({
        where: { buildingId: building.id },
      });
      inverters.push(...buildingInverters);
    }

    const possibleCollectTimes = await this.getCompanyCollectTimes(companyId);

    return await this.processPeakPowersFromInverters(
      inverters,
      collectTime,
      possibleCollectTimes,
    );
  }

  async getPeakPowerForBuilding(buildingId: number, collectTime: string) {
    // Fetch inverters for this building
    const building = await this.prisma.building.findUniqueOrThrow({
      where: {
        id: buildingId,
      },
    });
    const inverters = await this.prisma.inverter.findMany({
      where: { buildingId: building.id },
    });

    const possibleCollectTimes = await this.getBuildingCollectTimes(buildingId);

    return await this.processPeakPowersFromInverters(
      inverters,
      collectTime,
      possibleCollectTimes,
    );
    // Extract inverter IDs

    // Get peak powers for these inverters
    // return await this.getPeakPowersForInverters(inverterIds);
  }

  async getPeakPowerForInverter(inverterId: number, collectTime) {
    const inverter = await this.prisma.inverter.findUniqueOrThrow({
      where: {
        id: inverterId,
      },
    });

    const possibleCollectTimes = await this.getInverterCollectTimes(inverterId);
    return await this.processPeakPowersFromInverters(
      [inverter],
      collectTime,
      possibleCollectTimes,
    );
    // Get peak powers for this inverter
    // return await this.getPeakPowersForInverters([inverterId]);
  }

  async getCurrentPowerGeneration(inverterIds: number[]): Promise<number> {
    let totalPowerGenerationInKW = 0;

    for (const inverterId of inverterIds) {
      // Find the latest daily data for the given inverter
      const latestDailyData = await this.prisma.inverterDailyData.findFirst({
        where: {
          inverterId: inverterId,
        },
        orderBy: {
          collectTime: 'desc',
        },
      });

      if (!latestDailyData || !latestDailyData.frameData) {
        continue;
      }

      // Parse the frameData
      let frameDataArray;
      try {
        frameDataArray = JSON.parse(latestDailyData.frameData);
      } catch (e) {
        console.error('Error parsing frameData: ', e);
        continue;
      }

      // Get the last collected value
      const lastCollectedValue =
        frameDataArray[frameDataArray.length - 1].value;

      // Convert to KW and add to the total
      totalPowerGenerationInKW += lastCollectedValue / 1000;
    }

    return totalPowerGenerationInKW;
  }

  // getInverterCurrentPower
  // getInverterRealtimeView
  async getInverterRealtimeView(
    inverterId: number,
  ): Promise<{ currentInverterPower: number }> {
    const power = await this.getCurrentPowerGeneration([inverterId]);
    return { currentInverterPower: power };
  }

  // getBuildingRealtimeView
  async getBuildingLiveView(buildingId: number) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: { id: buildingId },
      include: { inverters: true, meters: true },
    });
    const inverterIds = building.inverters.map((inverter) => inverter.id);

    const meters = building.meters.map((meter) => meter);

    // //;

    const power = await this.getCurrentPowerGeneration(inverterIds);

    let totalMeterPower = 0;
    for (const meter of meters) {
      ////;
      // //;
      ////;
      totalMeterPower += await this.meterService.getMeterLiveView(
        meter.exportMeterSerialNumber,
      );
    }

    return totalMeterPower >= 0
      ? {
          currentInverterPower: power,
          currentMeterPower: {
            export: totalMeterPower,
          },
          currentLoad: {
            solar: power - totalMeterPower,
          },
        }
      : {
          currentInverterPower: power,
          currentMeterPower: {
            import: -totalMeterPower,
          },
          currentLoad: {
            grid: -totalMeterPower,
            solar: power,
          },
        };
  }

  // getProjectRealtimeView
  async getProjectLiveView(projectId: number) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { inverters: true },
    });
    const inverterIds = project.inverters.map((inverter) => inverter.id);
    const power = await this.getCurrentPowerGeneration(inverterIds);

    // return { currentInverterPower: power };

    const totalMeterPower =
      (await this.meterService.getMeterLiveView(
        project.exportMeterSerialNumber,
      )) * 24000;

    ////;

    return totalMeterPower >= 0
      ? {
          currentInverterPower: power,
          currentMeterPower: {
            export: totalMeterPower,
          },
          currentLoad: {
            solar: power - totalMeterPower,
          },
        }
      : {
          currentInverterPower: power,
          currentMeterPower: {
            import: -totalMeterPower,
          },
          currentLoad: {
            grid: -totalMeterPower,
            solar: power,
          },
        };
  }

  // getCompanyRealtimeView
  async getCompanyLiveView(companyId: number) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      include: { buildings: { include: { inverters: true, meters: true } } },
    });

    const inverterIds = company.buildings.flatMap((building) =>
      building.inverters.map((inverter) => inverter.id),
    );
    const power = await this.getCurrentPowerGeneration(inverterIds);

    let totalImport = 0;
    let totalExport = 0;
    // let power = 0;

    const promises = company.buildings.map(async (building) => {
      const result = await this.getBuildingLiveView(building.id);

      // power += result.currentInverterPower;
      if (result.currentMeterPower.import)
        totalImport += result.currentMeterPower.import;
      if (result.currentMeterPower.export)
        totalExport += result.currentMeterPower.export;
    });

    // Wait for all promises to resolve before continuing
    await Promise.all(promises);
    // return { currentInverterPower: power };

    ////;

    // //
    // //

    const totalMeterPower = totalImport - totalExport;

    return totalMeterPower >= 0
      ? {
          currentInverterPower: power,
          currrentMeterPower: {
            export: totalMeterPower,
          },
          currentLoad: {
            solar: power - totalMeterPower,
          },
        }
      : {
          currentInverterPower: power,
          currrentMeterPower: {
            import: -totalMeterPower,
          },
          currentLoad: {
            grid: -totalMeterPower,
            solar: power,
          },
        };
  }
}
