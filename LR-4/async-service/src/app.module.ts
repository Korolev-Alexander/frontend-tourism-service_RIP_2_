import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrafficModule } from './traffic/traffic.module';

@Module({
  imports: [TrafficModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
