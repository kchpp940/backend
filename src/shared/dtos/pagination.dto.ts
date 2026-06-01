import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PaginationMetaDto {
  @ApiProperty({ description: '每页返回的记录数', example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ description: '跳过的记录数（从 0 开始）', example: 0 })
  @Expose()
  offset: number;

  @ApiProperty({ description: '符合条件的总记录数', example: 20 })
  @Expose()
  total: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  @Expose()
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  meta: PaginationMetaDto;
}
