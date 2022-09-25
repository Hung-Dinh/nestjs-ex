import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { SpamReport } from '../entities/spam-report.entity';

@EntityRepository(SpamReport)
export class SpamReportRepository extends Repository<SpamReport> {
    async getById(id: number): Promise<SpamReport> {
        const spamReport = await this.findOne(id);
        if (!spamReport) {
          // console.log('id ________NF', id);
          throw new NotFoundException();
        }
        return spamReport;
      }
}
