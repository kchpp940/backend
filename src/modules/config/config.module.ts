import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfigController } from '../../api/config/config.controller';
import { CommonModule } from '../../common/common.module';
import { appConfig } from '../../config/app.config';
import { databaseConfig } from '../../config/database.config';
import { environmentConfig } from '../../config/environment.config';
import { logConfig } from '../../config/log.config';
import { redisConfig } from '../../config/redis.config';
import { securityConfig } from '../../config/security.config';
import { sentryConfig } from '../../config/sentry.config';
import { swaggerConfig } from '../../config/swagger.config';
import { EnvironmentModule } from '../environment/environment.module';
import { ConfigDiagnosticService } from './config.service';

@Module({
  controllers: [ConfigController],
  exports: [ConfigDiagnosticService],
  imports: [
    CommonModule,
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(databaseConfig),
    ConfigModule.forFeature(environmentConfig),
    ConfigModule.forFeature(logConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(securityConfig),
    ConfigModule.forFeature(sentryConfig),
    ConfigModule.forFeature(swaggerConfig),
    EnvironmentModule,
  ],
  providers: [ConfigDiagnosticService],
})
export class ConfigDiagnosticModule {}
