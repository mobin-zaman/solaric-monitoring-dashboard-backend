import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { log } from 'console';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('/test')
  async getProjectHourly() {
    // return await this.dashboardService.getHourlyInverterFrameData(1, '2023-05-03')
    //  await this
    // await this.dashboardServi
    return await this.dashboardService.test();
  }

  //!ALL PROECTS IMPLEMENTED
  @Get('/project/historic-view/:projectID/:collectTime?')
  async getProjectHistoricView(
    @Param('projectID', ParseIntPipe) projectID: number,
    @Param('collectTime') collectTime?: string,
  ) {
    try {
      return await this.dashboardService.getProjectHistoricView(
        projectID,
        collectTime,
      );
    } catch (error) {
      console.log(
        '🚀 ~ file: dashboard.controller.ts:35 ~ DashboardController ~ error:',
        error,
      );

      throw new BadRequestException(error.message);
    }
  }

  addMissingDatesInSunHousBarChart(data) {
    // Convert the data to a map with the dates as keys
    let dataMap = new Map(data.map((item) => [item.collectTime, item]));

    // Get the start and end dates
    let startDate = new Date(data[0].collectTime);
    let endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1,
    );

    // Iterate over all dates in the range
    for (
      let currentDate = startDate;
      currentDate < endDate;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      // Convert the date to a string
      let dateStr = currentDate.toISOString().split('T')[0];

      // If the date is not in the data, add it
      if (!dataMap.has(dateStr)) {
        dataMap.set(dateStr, { collectTime: dateStr });
      }
    }

    // Convert the data back to an array
    let newData = Array.from(dataMap.values());

    return newData;
  }

  checkDateFormat(collectTime) {
    let yearlyPattern = /^\d{4}$/;
    let monthlyPattern = /^\d{4}-\d{2}$/;

    if (yearlyPattern.test(collectTime)) {
      return 'YEARLY';
    } else if (monthlyPattern.test(collectTime)) {
      return 'MONTHLY';
    } else {
      return 'Invalid format';
    }
  }

  @Get('/project/bar-chart-view/sun-hrs/:projectId/:collectTime')
  async getProjectSunHoursBargraph(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('collectTime') collectTime: string,
  ) {
    // // try {
    console.log('EXECUTING GET PROJECT SUN HOURS BARGRRAPH');

    // ;
    // ;
    const result = await this.dashboardService.getProjectSunHoursBargraphData(
      projectId,
      collectTime,
    );

    if (this.checkDateFormat(collectTime) === 'MONTHLY')
      return this.addMissingDatesInSunHousBarChart(result);
    else return result;
    // } catch (error) {
    // throw new BadRequestException(error.message);
    // }
  }

  @Get('/company/historic-view/:companyId/:collectTime?')
  async getCompanyHistoricView(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('collectTime') collectTime?: string,
  ) {
    try {
      return await this.dashboardService.getCompanyHistoricView(
        companyId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/company/bar-chart-view/sun-hrs/:companyId/:collectTime')
  async getCompanySunHoursBargraph(
    @Param('companyId', ParseIntPipe) companyId: number,

    @Param('collectTime') collectTime: string,
  ) {
    try {
      const result = await this.dashboardService.getCompanySunHoursBargraphData(
        companyId,
        collectTime,
      );

      if (this.checkDateFormat(collectTime) === 'MONTHLY')
        return this.addMissingDatesInSunHousBarChart(result);
      else return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/building/historic-view/:buildingId/:collectTime?')
  async getBuildingHistoricView(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('collectTime') collectTime?: string,
  ) {
    try {
      console.log('CMING HERE');
      return await this.dashboardService.getBuildingHistoricView(
        buildingId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/building/bar-chart-view/sun-hrs/:buildingId/:collectTime')
  async getBuildingSunHoursBargraph(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      const result =
        await this.dashboardService.getBuildingSunHoursBargraphData(
          buildingId,
          collectTime,
        );

      if (this.checkDateFormat(collectTime) === 'MONTHLY')
        return this.addMissingDatesInSunHousBarChart(result);
      else return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/inverter/historic-view/:inverterId/:collectTime?')
  async getInverterHistoricView(
    @Param('inverterId', ParseIntPipe) inverterId: number,
    @Param('collectTime') collectTime?: string,
  ) {
    try {
      return await this.dashboardService.getInverterHistoricView(
        inverterId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/inverter/bar-chart-view/sun-hrs/:inverterId/:collectTime')
  async getInverterSunHoursBargraph(
    @Param('inverterId', ParseIntPipe) inverterId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      const result =
        await this.dashboardService.getInverterSunHoursBargraphData(
          inverterId,
          collectTime,
        );

      if (this.checkDateFormat(collectTime) === 'MONTHLY')
        return this.addMissingDatesInSunHousBarChart(result);
      else return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //!ALL PROJECT ON COMPLETE - HAVE QUESTION
  @Get('/project/environment-impact/:projectId/:collectTime?')
  async getProjectEnvironmentImpact(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getProjectEnvironmentImpact(
        projectId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/company/environment-impact/:companyId/:collectTime?')
  async getCompanyEnvironmentImpact(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getCompanyEnvironmentImpact(
        companyId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/building/environment-impact/:buildingId/:collectTime?')
  async getBuildingEnvironmentImpact(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getBuildingEnvironmentImpact(
        buildingId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/inverter/environment-impact/:inverterId/:collectTime?')
  async getInverterEnvironmentImpact(
    @Param('inverterId', ParseIntPipe) inverterId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getInverterEnvironmentImpact(
        inverterId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-view/inverter/frame-data/:inverterId/:collectTime')
  async getFrameData(
    @Param('inverterId', ParseIntPipe) inverterId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      const result = await this.dashboardService.getInverterFrameData(
        inverterId,
        collectTime,
      );

      const result2 = this.dashboardService.fillMissingTimes({
        frameDataArray: result.frameDataArray,
      });
      result.frameDataArray = result2;
      // ;
      return {
        inverterId: inverterId,
        collectTime: collectTime,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-view/inverter/collect-times/:inverterId')
  async getInverterCollectTimes(
    @Param('inverterId', ParseIntPipe) inverterId: number,
  ) {
    try {
      return await this.dashboardService.getInverterCollectTimes(inverterId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-view/building/frame-data/:buildingId/:collectTime')
  async getBuildingFrameData(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      if (!collectTime) throw new BadRequestException('Collectime is required');
      const result = await this.dashboardService.getBuildingFrameData(
        buildingId,
        collectTime,
      );

      const result2 = this.dashboardService.fillMissingTimes({
        frameDataArray: result.frameDataArray,
      });
      result.frameDataArray = result2;
      // Build and return the frame data
      // Modify the code below according to your requirements
      const frameData = {
        buildingId: buildingId,
        collectTime: collectTime,
        data: result,
      };
      return frameData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('daily-view/building/collect-times/:buildingId')
  async getBuildingCollectTimes(
    @Param('buildingId', ParseIntPipe) buildingId: number,
  ) {
    try {
      return await this.dashboardService.getBuildingCollectTimes(buildingId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-view/company/frame-data/:companyId/:collectTime')
  async getCompanyFrameData(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      if (!collectTime) throw new BadRequestException('Collectime is required');
      const result = await this.dashboardService.getCompanyFrameData(
        companyId,
        collectTime,
      );

      const result2 = this.dashboardService.fillMissingTimes({
        frameDataArray: result.frameDataArray,
      });
      result.frameDataArray = result2;
      const frameData = {
        companyId: companyId,
        collectTime: collectTime,
        data: result,
      };
      return frameData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('daily-view/company/collect-times/:companyId')
  async getCompanyCollectTimes(
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    try {
      return await this.dashboardService.getCompanyCollectTimes(companyId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //!ALL project frame data added
  @Get('daily-view/project/frame-data/:projectId/:collectTime')
  async getProjectFrameData(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      if (!collectTime) throw new BadRequestException('Collectime is required');
      const result = await this.dashboardService.getProjectFrameData(
        projectId,
        collectTime,
      );
      const result2 = this.dashboardService.fillMissingTimes({
        frameDataArray: result.frameDataArray,
      });
      // result.frameDataArray = await this.dashboardService.fillMissingTimes(result.frameDataArray)
      result.frameDataArray = result2;

      const frameData = {
        projectId: projectId,
        collectTime: collectTime,
        data: result,
      };
      return frameData;
    } catch (error) {
      console.log(
        '🚀 ~ file: dashboard.controller.ts:331 ~ DashboardController ~ error:',
        error,
      );
      throw new BadRequestException(error.message);
    }
  }

  //!ALL project frame data added
  @Get('daily-view/project/collect-times/:projectId')
  async getProjectCollectTimes(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    try {
      return await this.dashboardService.getProjectCollectTimes(projectId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //!ALL peak power completed
  @Get('historic-view/peak-power/project/:projectId/:collectTime')
  async getProjectPeakPower(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      //
      console.log('Cming here');
      const result = await this.dashboardService.getPeakPowerForProject(
        projectId,
        collectTime,
      );

      return this.addMissingDatesInSunHousBarChart(result);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('historic-view/peak-power/company/:companyId/:collectTime')
  async getCompanyPeakPower(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getPeakPowerForCompany(
        companyId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('historic-view/peak-power/building/:buildingId/:collectTime')
  async getBuildingPeakPower(
    @Param('buildingId', ParseIntPipe) buildingId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getPeakPowerForBuilding(
        buildingId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('historic-view/peak-power/inverter/:inverterId/:collectTime')
  async getInverterPeakPower(
    @Param('inverterId', ParseIntPipe) inverterId: number,
    @Param('collectTime') collectTime: string,
  ) {
    try {
      return await this.dashboardService.getPeakPowerForInverter(
        inverterId,
        collectTime,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('real-time/inverter/:inverterId')
  async getInverterRealtimeView(
    @Param('inverterId', ParseIntPipe) inverterId: number,
  ) {
    try {
      return this.dashboardService.getInverterRealtimeView(inverterId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('live-view/building/:buildingId')
  async getBuildingLiveView(
    @Param('buildingId', ParseIntPipe) buildingId: number,
  ) {
    try {
      return this.dashboardService.getBuildingLiveView(buildingId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('live-view/project/:projectId')
  async getProjectRealtimeView(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    try {
      return this.dashboardService.getProjectLiveView(projectId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('live-view/company/:companyId')
  async getCompanyRealtimeView(
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    try {
      return this.dashboardService.getCompanyLiveView(companyId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
