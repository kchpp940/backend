import { Module } from '@nestjs/common';

import { TodosController } from '../../api/todos/todos.controller';
import { PrismaModule } from '../../modules/prisma/prisma.module';
import { RedisManagerModule } from '../../modules/redis-manager/redis-manager.module';
import { TodoAuditsModule } from '../todo-audits/todo-audits.module';
import { TodosRepository } from './todos.repository';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  imports: [PrismaModule, RedisManagerModule, TodoAuditsModule],
  providers: [TodosService, TodosRepository],
})
export class TodosModule {}
