import { Controller, Get, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { ApiErrors, ApiOk } from '../../common/decorators/swagger.decorators';
import { Role } from '../../common/enums/role.enum';
import { AuthGuard, RoleGuard } from '../../common/guards';
import { CONFIG_ENDPOINT } from '../../constants/url.contants';
import {
  AdminNotConfiguredError,
  UserInsufficientPermissionsError,
  UserIsNotAuthorizedError,
} from '../../error-handler/errors/user.errors';
import { ConfigDiagnosticService } from '../../modules/config/config.service';
import { ConfigDiagnosticResponseDto } from './dtos/responses/config-diagnostic-response.dto';

@Controller(CONFIG_ENDPOINT)
@UseGuards(AuthGuard, RoleGuard)
export class ConfigController {
  constructor(private readonly configDiagnosticService: ConfigDiagnosticService) {}

  @ApiErrors(UserIsNotAuthorizedError, UserInsufficientPermissionsError, AdminNotConfiguredError)
  @ApiOk(ConfigDiagnosticResponseDto, {
    access: true,
    description: 'Returns sanitized configuration snapshot. Admin or Operator role required.',
    title: 'Get configuration diagnostic',
  })
  @Get('diagnostic')
  @Roles(Role.Admin, Role.Operator)
  getDiagnostic(): ConfigDiagnosticResponseDto {
    return this.configDiagnosticService.getSanitizedConfig();
  }
}
