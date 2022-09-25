import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { MessageModule } from 'src/message/message.module';
import { NetworkModule } from 'src/network/network.module';
import { SharedModule } from 'src/shared/shared.module';

import { SpamReportController } from './controllers/spam-report.controller';
import { SpamReportRepository } from './repositories/spam-report.repository';
import { SpamReportService } from './services/spam-report.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([SpamReportRepository]),
    MessageModule,
    ChatRoomModule,
    MemberInRoomModule,
    NetworkModule,
  ],
  providers: [SpamReportService],
  controllers: [SpamReportController],
  exports: [SpamReportService],
})
export class SpamReportModule {}
