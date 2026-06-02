import { Module } from '@nestjs/common';

import { ClientLogsController } from '../../api/client-logs/client-logs.controller';
import { MetricsModule } from '../../modules/metrics/metrics.module';
import { ClientLogsService } from './client-logs.service';

@Module({
  controllers: [ClientLogsController],
  imports: [MetricsModule],
  providers: [ClientLogsService],
})
export class ClientLogsModule {}
