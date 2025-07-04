import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000', // หรือ URL ของ frontend
    credentials: true, // 👈 สำคัญมาก
  });

  // ✅ Use cookie parser
  app.use(cookieParser());




  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
