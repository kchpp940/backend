import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class ConfigDiagnosticResponseDto {
  @ApiProperty({ description: 'Application name', example: 'backend' })
  @Expose()
  @IsString()
  appName: string;

  @ApiProperty({ description: 'Application version', example: '1.0.0' })
  @Expose()
  @IsString()
  appVersion: string;

  @ApiProperty({ description: 'Database log levels', example: ['query', 'error'] })
  @Expose()
  @IsArray()
  databaseLogLevels: string[];

  @ApiProperty({ description: 'Current environment name', example: 'development' })
  @Expose()
  @IsString()
  environment: string;

  @ApiProperty({ description: 'Excluded endpoints from logging', example: ['/health'] })
  @Expose()
  @IsArray()
  logExcludeEndpoints: string[];

  @ApiProperty({ description: 'Log level', example: 'info' })
  @Expose()
  @IsString()
  logLevel: string;

  @ApiProperty({ description: 'Pretty logging enabled', example: true })
  @Expose()
  @IsBoolean()
  logPretty: boolean;

  @ApiProperty({ description: 'Application port', example: 3000 })
  @Expose()
  @IsNumber()
  port: number;

  @ApiProperty({ description: 'Redis enabled status', example: true })
  @Expose()
  @IsBoolean()
  redisEnabled: boolean;

  @ApiProperty({ description: 'Redis host', example: 'localhost' })
  @Expose()
  @IsString()
  redisHost: string;

  @ApiProperty({ description: 'Redis port', example: 6379 })
  @Expose()
  @IsNumber()
  redisPort: number;

  @ApiProperty({ description: 'Sentry enabled status', example: true })
  @Expose()
  @IsBoolean()
  sentryEnabled: boolean;

  @ApiProperty({ description: 'Swagger enabled status', example: true })
  @Expose()
  @IsBoolean()
  swaggerEnabled: boolean;

  @ApiProperty({ description: 'Swagger endpoint', example: 'docs' })
  @Expose()
  @IsString()
  swaggerEndpoint: string;
}
