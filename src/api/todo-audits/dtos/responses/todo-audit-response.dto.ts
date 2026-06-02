import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsString } from 'class-validator';

export class TodoAuditResponseDto {
  @ApiProperty()
  @Expose()
  @IsString()
  action: string;

  @ApiProperty({ nullable: true })
  @Expose()
  after?: unknown;

  @ApiProperty({ nullable: true })
  @Expose()
  before?: unknown;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  operatorId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  todoId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  traceId: string;
}
