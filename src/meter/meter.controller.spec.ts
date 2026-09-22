import { Test, TestingModule } from '@nestjs/testing';
import { MeterController } from './meter.controller';

describe('MeterController', () => {
  let controller: MeterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeterController],
    }).compile();

    controller = module.get<MeterController>(MeterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
