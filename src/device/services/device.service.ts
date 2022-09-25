import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { DeviceOutput } from '../dtos/device-output.dto';
import { UpdateUserDeviceInput } from '../dtos/update-user-device-input.dto';
import { Device } from '../entities/device.entity';
import { DeviceRepository } from '../repositories/device.repository';

@Injectable()
export class DeviceService {
  constructor(
    private logger: AppLogger,
    private deviceRepository: DeviceRepository,
  ) {
    this.logger.setContext(DeviceService.name);
  }

  async findDeviceByDeviceId(deviceId: string): Promise<Device> {
    if (!deviceId) {
      throw new Error('deviceId is required');
    }

    return this.deviceRepository.findOne({
      where: {
        deviceId,
      },
    });
  }

  async updateDevice(
    ctx: RequestContext,
    userId: number,
    input: UpdateUserDeviceInput,
  ): Promise<DeviceOutput> {
    this.logger.log(ctx, `${this.updateDevice.name} was called`);

    const device = await this.findDeviceByDeviceId(input.deviceId);

    let result = null;

    if (device) {
      const updatedDevice = plainToClass(Device, {
        ...device,
        ...input,
        userId,
        updatedAt: new Date(),
      });
      result = await this.deviceRepository.save(updatedDevice);
    } else {
      const newDevice = plainToClass(Device, {
        ...input,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      result = await this.deviceRepository.save(newDevice);
    }

    return plainToClass(DeviceOutput, result, {
      excludeExtraneousValues: true,
    });
  }
}
