import { EntityRepository, Repository } from 'typeorm';

import { Device } from '../entities/device.entity';

@EntityRepository(Device)
export class DeviceRepository extends Repository<Device> {}
