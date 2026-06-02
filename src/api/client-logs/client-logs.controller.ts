import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiErrors } from '../../common/decorators/swagger.decorators';
import { InternalServerError } from '../../error-handler/errors/common.errors';
import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';
import { ClientLogsService } from '../../features/client-logs/client-logs.service';
import { BatchClientLogsResponseDto } from './dtos/batch-client-log-result.dto';
import { BatchClientLogsDto } from './dtos/batch-client-logs.dto';
import { MobileLogDto } from './dtos/mobile-log.dto';
import { WebLogDto } from './dtos/web-log.dto';

@ApiTags('Client Logs')
@Controller({
  path: 'client-logs',
  version: '1',
})
export class ClientLogsController {
  constructor(private readonly clientLogsService: ClientLogsService) {}

  @ApiBody({ type: BatchClientLogsDto })
  @ApiErrors(DtoValidationErrors, InternalServerError)
  @ApiOperation({ summary: 'Batch ingest client logs (web and/or mobile)' })
  @ApiResponse({ description: 'Batch processed', status: HttpStatus.OK, type: BatchClientLogsResponseDto })
  @HttpCode(HttpStatus.OK)
  @Post('batch')
  postBatchLogs(@Body() dto: BatchClientLogsDto): BatchClientLogsResponseDto {
    return this.clientLogsService.processBatchLogs(dto);
  }

  @ApiBody({ type: MobileLogDto })
  @ApiErrors(DtoValidationErrors, InternalServerError)
  @ApiOperation({ summary: 'Ingest mobile client logs' })
  @ApiResponse({ description: 'Logs accepted', status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('mobile')
  postMobileLogs(@Body() dto: MobileLogDto): void {
    this.clientLogsService.processMobileLog(dto);
  }

  @ApiBody({ type: WebLogDto })
  @ApiErrors(DtoValidationErrors, InternalServerError)
  @ApiOperation({ summary: 'Ingest web client logs' })
  @ApiResponse({ description: 'Logs accepted', status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('web')
  postWebLogs(@Body() dto: WebLogDto): void {
    this.clientLogsService.processWebLog(dto);
  }
}
