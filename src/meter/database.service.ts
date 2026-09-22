import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private connection: mysql.Connection;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.connection = await mysql.createPool({
      host: this.configService.get<string>('HOP_IP_ADDRESS'),
      port: this.configService.get<number>('HOP_ACCESS_PORT'),
      user: this.configService.get<string>('HOP_USER'),
      password: this.configService.get<string>('HOP_PASSWORD'),
      database: this.configService.get<string>('HOP_DATABASE'),
      connectionLimit: 10,
    });
    //;
  }

  async onModuleDestroy() {
    await this.connection.end();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    try {
      const [rows] = await this.connection.execute(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}
// SELECT
// 	ra.devicesign AS sn,
// 	cm.meterCount AS meterCount,
// 	cm.recordtime
// FROM
// 	res_ammeter ra
// 	LEFT JOIN cap_meter cm ON cm.ammeterid = ra.ammeterID
// WHERE
// 	cm.recordtime BETWEEN '2023-06-01 00:00:00'
// 	AND '2023-06-21 23:59:59' AND ra.devicesign = 61590034
// ORDER BY
// 	cm.recordtime

// getting evergy of a day
//  SELECT
// 	ra.devicesign AS sn,
// 	rcm.totalusage AS dayusage,
// 	rcm.recordtime AS recordtime
// FROM
// 	res_ammeter ra
// 	LEFT JOIN rpt_cap_meter_202306 rcm ON rcm.ammeterid = ra.ammeterID
// 	WHERE ra.devicesign = 61590033
