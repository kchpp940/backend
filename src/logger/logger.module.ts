import { Global, Module } from '@nestjs/common';

import { EnvironmentModule } from '../modules/environment/environment.module';
import { LoggerService } from './logger.service';
import { TelemetryLogReporter } from './reporters/telemetry-log.reporter';

@Global()
@Module({
  exports: [LoggerService],
  imports: [EnvironmentModule],
  providers: [LoggerService, TelemetryLogReporter],
})
export class LoggerModule {}
