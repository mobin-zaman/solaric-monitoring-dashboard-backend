import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';


import { FirebaseModule } from 'nestjs-firebase';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/roles.guard';
import { SolarmanService } from './solarman/solarman.service';
import { SolarmanModule } from './solarman/solarman.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ProjectModule } from './project/project.module';
import { CompanyModule } from './company/company.module';
import { BuildingModule } from './building/building.module';
import { InverterModule } from './inverter/inverter.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { DashboardModule } from './dashboard/dashboard.module';
import { MeterModule } from './meter/meter.module';
import { ExcelModule } from './excel/excel.module';
import { ExportModule } from './export/export.module';

const firebaseConfigJsonPath: string = process.env.FIREBASE_CREDENTIAL_PATH || '';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // BullModule.forRoot({
    //   // redis: {
    //   // host: 'localhost', // replace with your own Redis host
    //   // port: 6379, // replace with your own Redis port
    //   // },
    //   redis: new Redis(),
    // }),
    // BullModule.registerQueue({
    //   name: 'api',
    //   limiter: {
    //     max: 1,
    //     duration: 2000,
    //   },
    // }),
    // ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      store: 'redis',
      host: 'localhost',
      port: '6379',
      ttl: 30 * 24 * 60 * 60,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    FirebaseModule.forRoot({
      //FIXME: as this is string, need the path module
      googleApplicationCredential: firebaseConfigJsonPath,
    }),
    UserModule,
    FirebaseModule,
    AuthModule,
    SolarmanModule,
    ProjectModule,
    CompanyModule,
    BuildingModule,
    InverterModule,
    DashboardModule,
    MeterModule,
    ExcelModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService, RolesGuard],
})
export class AppModule {}
