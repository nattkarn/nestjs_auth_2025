import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000', // หรือ URL ของ frontend
    credentials: true, // 👈 สำคัญมาก
  });

  // ✅ Use cookie parser
  app.use(cookieParser());

  const config = new DocumentBuilder()
  .setTitle('Auth API')
  .setDescription('API สำหรับระบบสมัครสมาชิก ยืนยันอีเมล และ JWT Auth')
  .setVersion('1.0')
  .addBearerAuth() // สำหรับใช้กับ JWT
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('/api/docs', app, document);


  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
