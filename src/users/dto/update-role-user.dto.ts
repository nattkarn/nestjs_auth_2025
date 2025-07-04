import { IsEnum, IsString } from 'class-validator';

export class UpdateRoleUserDto {
  // 'USER', 'ADMIN', 'SUPER_ADMIN'
  @IsString()
  @IsEnum(['USER', 'ADMIN'])
  role: string;
}
