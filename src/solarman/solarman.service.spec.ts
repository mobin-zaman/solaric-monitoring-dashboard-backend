import { Test, TestingModule } from '@nestjs/testing';
import { SolarmanService } from './solarman.service';

describe('SolarmanService', () => {
  let service: SolarmanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolarmanService],
    }).compile();

    service = module.get<SolarmanService>(SolarmanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
