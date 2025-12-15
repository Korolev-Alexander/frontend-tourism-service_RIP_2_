import { Controller, Post, Body, BadRequestException, HttpCode } from '@nestjs/common';
import { TrafficService } from './traffic.service';

@Controller('api/traffic_calculation_async')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Post()
  @HttpCode(200)
  async submitRequest(@Body() body: any) {
    if (!body.order_id || !body.devices) {
      throw new BadRequestException('Invalid payload: order_id and devices are required');
    }

    // Запускаем асинхронную задачу БЕЗ await - сразу возвращаем ответ
    this.trafficService.sendTrafficResult(body);

    console.log(`🚀 Запущен асинхронный расчет трафика для заявки ${body.order_id}`);

    return { status: 'ok', message: 'Traffic calculation started' };
  }
}
