import { Module } from '@nestjs/common';
import { SolarmanService } from './solarman.service';
import { Cache } from 'cache-manager';
import { AppModule } from 'src/app.module';
import { ConfigModule } from '@nestjs/config';
import { SolarmanProcessor } from './solarman.processor';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: 'api',
    //   limiter: {
    //     max: 1,
    //     duration: 1000,
    //   },
    // }),
  ],
  providers: [SolarmanService],
  exports: [SolarmanService],
})
export class SolarmanModule {}
