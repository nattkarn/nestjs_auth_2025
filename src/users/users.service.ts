import {
  Inject,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/util/email.util';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import { AccountStatus, Role } from '@prisma/client';
import { ResendVerificationDto } from './dto/resend-email.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleUserDto } from './dto/update-role-user.dto';
import { Redis } from 'ioredis';

const hashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  //For auth only
  async findByUsernameHavePassword(data: { username: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          username: data.username,
          status: AccountStatus.ACTIVE,
          activated: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          password: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        message: 'User found successfully',
        httpStatus: 200,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          password: user.password,
          role: user.role.name,
        },
      };
    } catch (error) {
      throw new NotFoundException('User not found or User not active');
    }
  }

  async createUser(dto: CreateUserDto) {
    try {
      const userRole = await this.prisma.role.findUnique({
        where: { name: 'USER' },
      });
      if (!userRole) {
        throw new Error('User role not found');
      }

      // 👉 1. สร้าง user ก่อน
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: await hashedPassword(dto.password),
          roleId: userRole.id, // ระบบกำหนด
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

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 🔒 ถ้าไม่มี user หรือ activated ไปแล้ว
    if (!user) {
      // NOTE: ตอบแบบปลอดภัย ไม่เปิดเผยว่า email มีจริงหรือไม่
      throw new BadRequestException('Cannot resend verification');
    }

    if (user.activated) {
      throw new BadRequestException('User already activated');
    }

    // 🔁 สร้าง token ใหม่
    const token = uuidv4();
    const expiresAt = addMinutes(new Date(), 15);

    // 👇 ใช้ upsert เพื่อรองรับกรณีที่ยังไม่มี token
    await this.prisma.verificationToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // ✉️ ส่งลิงก์ยืนยันใหม่
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    await this.emailService.sendVerificationEmail(user.email, token);

    return {
      message: 'Verification email sent (if user exists and is not activated)',
    };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException('Token ไม่ถูกต้องหรือไม่มีในระบบ');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Token หมดอายุแล้ว');
    }

    // อัปเดตสถานะบัญชี
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        activated: true,
        status: 'ACTIVE',
      },
    });

    // ลบ token ทิ้งหลังใช้งาน
    await this.prisma.verificationToken.delete({
      where: { token },
    });

    return {
      message: 'ยืนยันอีเมลเรียบร้อยแล้ว ✅',
      httpStatus: 200,
    };
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUsername(data: { username: string }) {
    const cacheKey = `user:info:${data.username}`;

    try {
      // 🔍 1. ตรวจ Redis ก่อน
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return {
          message: 'User found (from cache)',
          httpStatus: 200,
          data: JSON.parse(cached),
        };
      }

      const user = await this.prisma.user.findUnique({
        where: {
          username: data.username,
        },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          role: true,
          activated: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 💾 3. เก็บลง Redis TTL 300 วินาที
      await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 300);

      return {
        message: 'User found successfully',
        httpStatus: 200,
        data: user,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateUser(id: string, data: UpdateUserDto) {
    try {
      this.redis.del('user:info:{username}')
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          password: data.password,
        },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        message: 'User updated successfully',
        httpStatus: 200,
        data: user,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateRole(id: string, data: UpdateRoleUserDto) {
    try {
      this.redis.del('user:info:{username}')
      const roleId = await this.prisma.role.findUnique({
        where: { name: data.role },
      });

      if (!roleId) {
        throw new NotFoundException('Role not found');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          roleId: roleId.id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        message: 'User updated successfully',
        httpStatus: 200,
        data: user,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async deleteUser(id: string) {
    try {
      this.redis.del('user:info:{username}')
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status: AccountStatus.BANNED,
        },
      });
      return {
        message: 'User deleted successfully',
        httpStatus: 200,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async reviveUser(id: string) {
    try {
      this.redis.del('user:info:{username}')
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status: AccountStatus.ACTIVE,
        },
      });
      return {
        message: 'User revived successfully',
        httpStatus: 200,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }
}
