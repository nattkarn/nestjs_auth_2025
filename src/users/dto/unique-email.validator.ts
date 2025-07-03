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
export class UniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(email: string, _args: ValidationArguments): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return !user; // true if username is unique
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Email already in use';
  }
}

export function UniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'UniqueEmail',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: UniqueEmailConstraint,
    });
  };
}
