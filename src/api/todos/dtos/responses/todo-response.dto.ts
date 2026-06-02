import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsString } from 'class-validator';

import { TodoPriority } from '../../../../features/todos/interfaces/queries.enum';

export class TodoResponseDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  @Type(() => Boolean)
  completed: boolean;

  @ApiProperty({ nullable: true, required: false })
  @Expose()
  @IsString()
  description: null | string;

  @ApiProperty({
    description: 'ISO 8601 formatted due date, or null if not set',
    example: '2026-06-15T12:00:00.000Z',
    nullable: true,
    type: Date,
  })
  @Expose()
  @IsDate()
  @Type(() => Date)
  dueDate: Date | null;

  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Priority level: LOW, MEDIUM, or HIGH',
    enum: TodoPriority,
    example: TodoPriority.MEDIUM,
  })
  @Expose()
  @IsEnum(TodoPriority)
  priority: TodoPriority;

  @ApiProperty()
  @Expose()
  @IsString()
  title: string;

  @ApiProperty()
  @Expose()
  @IsString()
  userName: string;
}
