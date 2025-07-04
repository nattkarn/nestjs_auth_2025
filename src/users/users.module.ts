import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailService } from 'src/util/email.util';
import { RedisModule } from 'src/util/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [UsersController],
  providers: [UsersService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}
