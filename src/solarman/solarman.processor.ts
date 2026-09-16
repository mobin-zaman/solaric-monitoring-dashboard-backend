import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { SolarmanService } from './solarman.service';
import * as dayjs from 'dayjs';

@Processor('api')
export class SolarmanProcessor {
  constructor(private solarmanService: SolarmanService) {}

  // @Process()
  // async transcode(job: Job<{ apiCall: string; params: any[] }>) {
  // 	const { apiCall, params } = job.data;
  // 	const result = await this.solarmanService[apiCall](...params);
  // 	return result;
  // }

  @OnQueueActive()
  onActive(job: Job) {
    //console.log(
    // `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(
    // job.data,
    // )}`,
    // );
  }

  @OnQueueFailed()
  async onFailed(job: Job, err: any) {
    //;
    //;
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    //console.log(
    // `Completed job ${job.id} of type ${job.name}. Result: ${JSON.stringify(
    // result,
    // )}`,
    // );
  }

  @Process('getProjectList')
  async handleGetProjectList(job: Job) {
    try {
      const response = await this.solarmanService.axiosInstance.post(
        '/station/v1.0/list',
        {},
        await this.solarmanService.getAuthorizationHeader(),
      );

      //;
      //;
      return response.data.stationList;
    } catch (error) {
      //;
    }
  }

  @Process('getAllDevices')
  async handleGetAllDevices(job) {
    const stationId = job.data.stationId;
    const devices = [];
    let currentPage = 1;
    const pageSize = 50;

    while (true) {
      try {
        const response = await this.solarmanService.axiosInstance.post(
          '/station/v1.0/device',
          {
            stationId,
            page: currentPage,
            size: pageSize,
            deviceType: 'INVERTER',
          },
          await this.solarmanService.getAuthorizationHeader(),
        );

        const { data } = response;
        const { deviceListItems, total } = data;

        const mappedItems = deviceListItems.map(({ deviceSn, deviceId }) => ({
          deviceSn,
          deviceId,
        }));

        devices.push(...mappedItems);

        if (devices.length >= total) {
          break;
        }

        currentPage += 1;
      } catch (error) {
        console.error('Error fetching devices:', error.message);
        break;
      }
    }

    return devices;
  }

  @Process('getInverterDailyData')
  async handleGetInverterDailyData(job) {
    //;
    //;
    const { deviceId, deviceSn } = job.data;
    const endTime = dayjs().format('YYYY-MM-DD');
    const startTime = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    //;
    //;

    try {
      const response = await this.solarmanService.axiosInstance.post(
        '/device/v1.0/historical',
        {
          deviceId,
          deviceSn,
          startTime,
          endTime,
          timeType: 2,
        },
        await this.solarmanService.getAuthorizationHeader(),
      );

      //;
      //;
      const data = response.data.paramDataList;

      const result = data.map((item) => {
        const generationData = item.dataList.find(
          (dataItem) => dataItem.key === 'generation',
        );

        if (!generationData) {
          throw new Error('Generation data not found');
        }

        const generation = parseFloat(generationData.value);

        if (isNaN(generation)) {
          throw new Error(`Invalid generation value: ${generationData.value}`);
        }

        return {
          collectTime: item.collectTime,
          generation: generation,
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching inverter daily data:', error.message);
      throw error;
    }
  }
}
