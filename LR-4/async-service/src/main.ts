import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Разрешаем внешние подключения
  await app.listen(3000);
  console.log('🚀 Асинхронный сервис запущен на http://localhost:3000');
}
bootstrap();
