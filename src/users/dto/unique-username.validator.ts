import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueUsernameConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(username: string, _args: ValidationArguments): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return !user; // true if username is unique
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Username already in use';
  }
}

export function UniqueUsername(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'UniqueUsername',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: UniqueUsernameConstraint,
    });
  };
}
