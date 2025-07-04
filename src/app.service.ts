import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  async healthCheck(): Promise<object> {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
