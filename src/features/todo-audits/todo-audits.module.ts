import { Module } from '@nestjs/common';

import { TodoAuditsController } from '../../api/todo-audits/todo-audits.controller';
import { PrismaModule } from '../../modules/prisma/prisma.module';
import { TodoAuditsRepository } from './todo-audits.repository';
import { TodoAuditsService } from './todo-audits.service';

@Module({
  controllers: [TodoAuditsController],
  exports: [TodoAuditsService],
  imports: [PrismaModule],
  providers: [TodoAuditsService, TodoAuditsRepository],
})
export class TodoAuditsModule {}
