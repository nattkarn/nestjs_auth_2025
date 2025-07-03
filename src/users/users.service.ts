import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/util/email.util';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import { AccountStatus } from '@prisma/client';

const hashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

@Injectable()
export class UsersService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ){}


  async createUser(dto: CreateUserDto) {
    try {

      const userRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
      if (!userRole) {
        throw new Error('User role not found');
      }



      // 👉 1. สร้าง user ก่อน
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: await hashedPassword(dto.password),
          roleId: userRole.id,               // ระบบกำหนด
          status: AccountStatus.INACTIVE, // ยังไม่ยืนยันอีเมล
          activated: false,
        },
        select: {
          id: true,
          username: true,
          email: true,
          roleId: true,
          status: true,
        },
      });

      // 👉 2. สร้าง token หมดอายุภายใน 15 นาที
      const token = uuidv4();
      const expiresAt = addMinutes(new Date(), 15);

      await this.prisma.verificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // 👉 3. สร้างลิงก์ยืนยัน (URL ควรใช้จาก .env)
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
      const verificationLink = `${baseUrl}/verify-email?token=${token}`;

      // 👉 4. ส่งอีเมล
      const subject = `ยืนยันการสมัครใช้งาน ${process.env.APP_NAME}`;
      const message = `
  สวัสดีคุณ ${user.username},
  
  กรุณายืนยันอีเมลของคุณโดยคลิกลิงก์ด้านล่างนี้ภายใน 15 นาที:
  
  ${verificationLink}
  
  หากคุณไม่ได้สมัครใช้งาน กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  
  ขอบคุณ,
  ทีมงาน ${process.env.APP_NAME}
      `.trim();

      await this.emailService.sendVerificationEmail(user.email, token);

      return {
        message: 'User created. Verification email sent.',
        httpStatus: 201,
        data: user,
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const field = error.meta?.target?.[0] ?? 'Field';
        throw new BadRequestException(`${field} already exists`);
      }

      console.error('❌ Unexpected error during user creation:', error);
      throw new InternalServerErrorException('User creation failed');
    }
  }
}
