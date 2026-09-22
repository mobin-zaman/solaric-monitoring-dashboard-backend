import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma.service';
import { Meter, Prisma } from '@prisma/client';
import { UpdateMeterDto } from './dto/meter.dto';
import { DatabaseService } from './database.service';

@Injectable()
export class MeterService {
  constructor(
    private prisma: PrismaService,
    private dbService: DatabaseService,
  ) {}

  async test() {
    // const query = `select a.devicesign,b.recordtime,b.total_active_power from res_ammeter as a,cap_meter_detail as b WHERE a.ammeterID=b.ammeterid and b.total_active_power<0 and a.devicesign = ${61524133}`;
    // const query2 = `select a.devicesign,b.recordtime,b.total_active_power from res_ammeter as a,cap_meter_detail as b WHERE a.ammeterID=b.ammeterid and b.total_active_power<0 and a.devicesign = ${61524134}`;
    //   const meter1 = 61524067;
    //   const meter2 = 61590026;
    //  `

    //   const query2 = `SELECT a.devicesign, b.recordtime, b.total_active_power
    //   FROM res_ammeter AS a
    //   JOIN cap_meter_detail AS b ON a.ammeterID = b.ammeterid
    //   JOIN (
    //       SELECT a.devicesign, MAX(b.recordtime) AS max_recordtime
    //       FROM res_ammeter AS a
    //       JOIN cap_meter_detail AS b ON a.ammeterID = b.ammeterid
    //       WHERE  a.devicesign = ${meter2}
    //       GROUP BY a.devicesign
    //   ) AS c ON a.devicesign = c.devicesign AND b.recordtime = c.max_recordtime

    //   const query = `SELECT
    //   ra.devicesign AS sn,
    //   cm.meterCount AS total_active_power,
    //   cm.recordtime
    // FROM
    //   res_ammeter ra
    //   LEFT JOIN cap_meter cm ON cm.ammeterid = ra.ammeterID
    // WHERE
    //   cm.recordtime BETWEEN '2023-06-08 00:00:00'
    //   AND '2023-06-08 13:30:00'
    // ORDER BY
    //   sn,
    //   cm.recordtime`;
    //   const query = `SELECT
    //   ra.devicesign AS sn,
    //   rcm.totalusage AS dayusage,
    //   rcm.recordtime AS recordtime
    // FROM
    //   res_ammeter ra
    //   LEFT JOIN rpt_cap_meter_202209 rcm ON rcm.ammeterid = ra.ammeterID`;
    // const result2 = await this.dbService.query(query2);
    // //;

    // return {result, result2}
    const result = await this.getMeterLiveView(61524133);
    ////;

    return result;
    // return await this.getMeterLiveViewl(61524133);
  }

  async createMeter(data): Promise<Meter> {
    return this.prisma.meter.create({
      data,
    });
  }

  async updateMeter(id: number, data: UpdateMeterDto): Promise<Meter> {
    return this.prisma.meter.update({
      where: { id },
      data,
    });
  }

  async deleteMeter(id: number): Promise<Meter> {
    return this.prisma.meter.delete({
      where: { id },
    });
  }

  async getMeter(id: number): Promise<Meter | null> {
    return this.prisma.meter.findUnique({
      where: { id },
    });
  }

  async getAllMeters(search?: string, buildingId?: number): Promise<Meter[]> {
    const filter: Prisma.MeterFindManyArgs = {};

    if (search) {
      filter.where = {
        OR: [
          { importMeterCode: { contains: search } },
          { exportMeterCode: { contains: search } },
          { importMeterSerialNumber: { contains: search } },
          { exportMeterSerialNumber: { contains: search } },
        ],
      };
    }

    if (buildingId) {
      filter.where = {
        ...filter.where,
        buildingId: buildingId,
      };
    }

    return this.prisma.meter.findMany(filter ? filter : {});
  }

  async getHistoricViewData(meters: Meter[], collectTime: string) {
    let result: {
      import: {
        today: number;
        thisMonth: number;
        thisYear: number;
        allTime: number;
      };
      export: {
        today: number;
        thisMonth: number;
        thisYear: number;
        allTime: number;
      };
    } = {
      import: {
        today: 0,
        thisMonth: 0,
        thisYear: 0,
        allTime: 0,
      },
      export: {
        today: 0,
        thisMonth: 0,
        thisYear: 0,
        allTime: 0,
      },
    };

    for (const meter of meters) {
      const exportMeterData = await this.getSingleMeterHistoricData(
        meter.exportMeterSerialNumber,
        collectTime,
      );
      const importMeterData = await this.getSingleMeterHistoricData(
        meter.importMeterSerialNumber,
        collectTime,
      );

      result.export.allTime += exportMeterData.allTime;
      result.export.today += exportMeterData.today;
      result.export.thisMonth += exportMeterData.thisMonth;
      result.export.thisYear += exportMeterData.thisYear;

      result.import.allTime += importMeterData.allTime;
      result.import.today += importMeterData.today;
      result.import.thisMonth += importMeterData.thisMonth;
      result.import.thisYear += importMeterData.thisYear;
    }

    return result;
  }

  // `async generateMonthStringArray() {
  //   const startYear = 2022;
  //   const startMonth = 3;
  //   const currentYear = new Date().getFullYear();
  //   const currentMonth = new Date().getMonth() + 1; // January is month 0

  //   const months = [];
  //   let year = startYear;
  //   let month = startMonth;

  //   while (
  //     year < currentYear ||
  //     (year === currentYear && month <= currentMonth)
  //   ) {
  //     const formattedMonth = `${year}${month.toString().padStart(2, '0')}`;
  //     months.push(formattedMonth);

  //     month++;
  //     if (month > 12) {
  //       month = 1;
  //       year++;
  //     }
  //   }

  //   return months;
  // }`

  generateDateStringArray() {
    const startYear = 2023;
    const startMonth = 9;
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1); // set to yesterday's date
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // January is month 0

    const dates = [];
    let year = startYear;
    let month = startMonth;

    while (
      year < currentYear ||
      (year === currentYear && month <= currentMonth)
    ) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        if (
          year === currentYear &&
          month === currentMonth &&
          day > currentDate.getDate()
        ) {
          break;
        }
        const formattedDate = `${year}${month.toString().padStart(2, '0')}${day
          .toString()
          .padStart(2, '0')}`;
        dates.push(formattedDate);
      }

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return dates;
  }

  async getSingleMeterHistoricData(deviceSign, date: string) {
    const monthsTillToday = this.generateDateStringArray();
    let compiledResult = [];

    const promises = monthsTillToday.map(async (month) => {
      // ;
      // DATE_FORMAT( rcm.recordtime, '%Y-%m-%d' ) AS recordtime,

      const query = `
        SELECT
          ra.devicesign,
           rcm.recordtime  AS recordtime,
          max( rcm.meterCount )- min( rcm.meterCount ) AS dayusage 
        FROM
          res_ammeter ra
          LEFT JOIN cap_meter_${month} rcm ON ra.ammeterID = rcm.ammeterid 
        WHERE 
          ra.devicesign=${deviceSign}
      `;

      try {
        const cacheKey = query;

        const cacheValue = await this.prisma.inverterFrameDataCache.findFirst({
          where: {
            cacheKey: cacheKey,
          },
        });

        if (cacheValue) {
          const value = JSON.parse(cacheValue.data);
          return value;
        } else {
          const result = await this.dbService.query(query);
          // ;
          // result.recordtime = new Date(result.recordtime);
          //  if(result) return result;
          await this.prisma.inverterFrameDataCache.create({
            data: {
              cacheKey,
              data: JSON.stringify(result),
            },
          });
          return result;
        }
      } catch (error) {
        // ;
        console.log({ error });
        return 0;
      }
    });

    compiledResult = (await Promise.all(promises)).flat();
    // compiledResult.pop();
    // compiledResult.splice(-1,1);

    const today = date ? new Date(date) : new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // const currentYear = new Date(today.getFullYear(),1,1)
    const currentYear = today.getFullYear();

    // Calculate total day usage for today
    const todayDayUsage = compiledResult
      .filter((item) => item.recordtime && isSameDay(item.recordtime, today))
      .reduce((total, item) => total + (item.dayusage || 0), 0);

    // Calculate total day usage for the current month
    const monthDayUsage = compiledResult
      .filter(
        (item) => item.recordtime && isSameMonth(item.recordtime, currentMonth),
      )
      .reduce((total, item) => total + (item.dayusage || 0), 0);

    // Calculate total day usage for the current year
    const yearDayUsage = compiledResult
      .filter(
        (item) => item.recordtime && isSameYear(item.recordtime, currentYear),
      )
      .reduce((total, item) => total + (item.dayusage || 0), 0);

    // Calculate total day usage for all time
    const allTimeDayUsage = compiledResult.reduce(
      (total, item) => total + (item.dayusage || 0),
      0,
    );

    // Function to check if two dates are the same day

    function isSameDay(date1, date2) {
      return (
        new Date(date1).getFullYear() === new Date(date2).getFullYear() &&
        new Date(date1).getMonth() === new Date(date2).getMonth() &&
        new Date(date1).getDate() === new Date(date2).getDate()
      );
    }
    // Function to check if two dates are the same month
    function isSameMonth(date1, date2) {
      const result =
        new Date(date1).getFullYear() === new Date(date2).getFullYear() &&
        new Date(date1).getMonth() === new Date(date2).getMonth();
      return result;
    }

    // Function to check if a date is in the same year
    function isSameYear(date, year) {
      return new Date(date).getFullYear() === year;
    }
    // function isSameDay(date1, date2) {
    //   date1 = new Date(date1);
    //   return (
    //     date1.getFullYear() === date2.getFullYear() &&
    //     date1.getMonth() === date2.getMonth() &&
    //     date1.getDate() === date2.getDate()
    //   );
    // }

    // // Function to check if two dates are the same month
    // function isSameMonth(date1, date2) {
    //   date1 = new Date(date1);
    //   return (
    //     date1.getFullYear() === date2.getFullYear() &&
    //     date1.getMonth() === date2.getMonth()
    //   );
    // }

    // // Function to check if a date is in the same year
    // function isSameYear(date, year) {
    //   date = new Date(date);
    //   return date.getFullYear() === year;
    // }

    return {
      today: todayDayUsage,
      thisMonth: monthDayUsage,
      thisYear: yearDayUsage,
      allTime: allTimeDayUsage,
    };
  }

  async getMeterLiveView(exportMeterId) {
    //export meter positive means it is being exported.
    //export meter negative means it is being imported.

    const query = `SELECT a.devicesign, b.recordtime, b.total_active_power 
    FROM res_ammeter AS a
    JOIN cap_meter_detail AS b ON a.ammeterID = b.ammeterid
    JOIN (
        SELECT a.devicesign, MAX(b.recordtime) AS max_recordtime
        FROM res_ammeter AS a
        JOIN cap_meter_detail AS b ON a.ammeterID = b.ammeterid
        WHERE  a.devicesign = ${exportMeterId}
        GROUP BY a.devicesign
    ) AS c ON a.devicesign = c.devicesign AND b.recordtime = c.max_recordtime
    WHERE  a.devicesign = ${exportMeterId}`;
    const result = await this.dbService.query(query);
    // //
    return result[0].total_active_power;
  }
}
