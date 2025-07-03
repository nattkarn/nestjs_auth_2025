import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UniqueUsername } from '../dto/unique-username.validator';
import { UniqueEmail } from '../dto/unique-email.validator';


export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @UniqueUsername()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  @UniqueEmail()
  email: string;
}
