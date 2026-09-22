import { InjectQueue } from '@nestjs/bull';
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inverter } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { log } from 'console';
import * as dayjs from 'dayjs';

@Injectable()
export class SolarmanService {
  public axiosInstance: AxiosInstance;

  constructor(
    private configService: ConfigService,
    @Inject('CACHE_MANAGER') private cacheManager: Cache, // @InjectQueue('api') private apiQueue: Queue,
  ) {
    this.axiosInstance = axios.create({
      baseURL: 'https://globalapi.solarmanpv.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async obtainToken(): Promise<string> {
    // //;
    // const cachedToken = await this.cacheManager.get<string>(
    //   'solarmanAccessToken',
    // );

    // // //;
    // if (cachedToken) {
    //   // //;
    //   // //;
    //   return cachedToken;
    // }

    const appId = this.configService.get<string>('SOLARMAN_APP_ID');
    const appSecret = this.configService.get<string>('SOLARMAN_APP_SECRET');
    const email = this.configService.get<string>('SOLARMAN_EMAIL');
    const password = this.configService.get<string>('SOLARMAN_PASSWORD_SHA256');
    const orgId = this.configService.get<string>('SOLARMAN_ORG_ID');

    // //;

    try {
      const response = await this.axiosInstance.post(
        '/account/v1.0/token',
        {
          appSecret,
          email,
          password,
          orgId,
        },
        {
          params: {
            appId,
          },
        },
      );

      //;
      // //;

      if (response.data.success) {
        const accessToken = response.data.access_token;
        // const expiresIn = response.data.expires_in;
        // const expiresIn = 30 * 24 * 60 * 60;
        // const expiresIn = 2 * 24 * 60 * 60;

        // await this.cacheManager.set(
        //   'solarmanAccessToken',
        //   accessToken,
        //   expiresIn,
        // );
        // //;
        // //;
        return accessToken;
      } else {
        throw new HttpException(response.data.msg, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.log(
      '🚀 ~ file: solarman.service.ts:82 ~ SolarmanService ~ obtainToken ~ error:',
      error,
      );
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);

      } else {
        throw new HttpException(
          'Unknown error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async getAuthorizationHeader() {
    try {
      const accessToken = await this.obtainToken();
      return {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };
    } catch (error) {
      //;
      //;
      throw error;
    }
  }

  async getProjectList() {
    try {
      const response = await this.axiosInstance.post(
        '/station/v1.0/list',
        {},
        await this.getAuthorizationHeader(),
      );

      //;
      //;
      return response.data.stationList;
    } catch (error) {
      //;
    }
    // return this.apiQueue.add('getProjectList', []);
  }

  async getAllDevices(stationId: number) {
    const devices = [];
    let currentPage = 1;
    const pageSize = 50;

    while (true) {
      try {
        const response = await this.axiosInstance.post(
          '/station/v1.0/device',
          {
            stationId,
            page: currentPage,
            size: pageSize,
            deviceType: 'INVERTER',
          },
          await this.getAuthorizationHeader(),
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
    // return this.apiQueue.add('getAllDevices', [stationId]);
  }

  async getTotalInverterTodaysGenaration(inverters: Inverter[]) {
    try {
      //it will run getInverterTodaysGenaration for all inverters and the add the values and return the sum
      let totalGenaration = 0;
      //;
      //;
      // const inverterTodaysGenaration = await Promise.all(
      //   inverters.map((inverter) =>
      //     this.getInverterTodaysGenaration(inverter.deviceId, inverter.deviceSn),
      //   ),
      // );
      for (const inverter of inverters) {
        totalGenaration += await this.getInverterTodaysGenaration(
          inverter.deviceId,
          inverter.deviceSn,
        );
      }

      return totalGenaration;
    } catch (error) {
      throw error;
    }
  }

  async getInverterTodaysGenaration(deviceId, deviceSn) {
    const startTime = dayjs().format('YYYY-MM-DD');

    try {
      const response = await this.axiosInstance.post(
        '/device/v1.0/historical',
        {
          deviceId,
          deviceSn,
          startTime,
          endTime: startTime,
          timeType: 2,
        },
        await this.getAuthorizationHeader(),
      );

      // return response.data;

      const nameToParse = 'Production';

      const productionData = response.data.paramDataList[0].dataList.find(
        (data) => data.key === 'generation' && data.name === nameToParse,
      );

      const productionValue = productionData
        ? parseFloat(productionData.value)
        : 0;

      //*NOTE: the value here is in kWh
      return productionValue;
    } catch (error) {
      //;
      //;
      throw error;
    }
  }

  async getInverterDailyData(deviceId: number, deviceSn: string): Promise<any> {
    // //
    // return this.apiQueue.add('getInverterDailyData', {deviceId, deviceSn});
    const endTime = dayjs().format('YYYY-MM-DD');
    const startTime = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    // //;
    // //;

    try {
      const response = await this.axiosInstance.post(
        '/device/v1.0/historical',
        {
          deviceId,
          deviceSn,
          startTime,
          endTime,
          timeType: 2,
        },
        await this.getAuthorizationHeader(),
      );
      const data = response.data.paramDataList;
      //

      const result = await Promise.all(
        data.map(async (item) => {
          const generationData = item.dataList.find(
            (dataItem) => dataItem.key === 'generation',
          );

          // //

          if (!generationData) {
            throw new Error('Generation data not found');
          }

          const generation = parseFloat(generationData.value);
          // //

          if (isNaN(generation)) {
            throw new Error(
              `Invalid generation value: ${generationData.value}`,
            );
          }

          // //
          // //
          // const frameData = await this.getInverterFrameData(
          //   deviceId,
          //   deviceSn,
          //   item.collectTime,
          // );
          // //

          return {
            collectTime: item.collectTime,
            generation: generation,
            // frameData,
          };
        }),
      );

      return result;
    } catch (error) {
      console.error('Error fetching inverter daily data:', error.message);
      throw error;
    }
  }

  async getInverterFrameData(deviceId, deviceSn, date) {
    try {
      const response = await this.axiosInstance.post(
        '/device/v1.0/historical',
        {
          deviceId,
          deviceSn,
          startTime: date,
          endTime: date,
          timeType: 1,
        },
        await this.getAuthorizationHeader(),
      );

      // ;
      // ;

      const paramDataList = response.data.paramDataList;
      // ;

      const extractedData = [];

      for (const data of paramDataList) {
        const collectTime = data.collectTime;
        const dataList = data.dataList;

        for (const item of dataList) {
          if (item.name.includes('Total AC Output Power')) {
            //;
            extractedData.push({
              collectTime,
              value: parseFloat(item.value),
            });
            break;
          }
        }
      }

      return extractedData;
    } catch (error) {}
  }
}
