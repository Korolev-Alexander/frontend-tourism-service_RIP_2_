import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface DeviceItem {
  device_id: number;
  device_name: string;
  quantity: number;
  data_per_hour: number;
}

export interface RequestData {
  order_id: number;
  devices: DeviceItem[];
}

export function calculateTraffic(devices: DeviceItem[]): number {
  let totalTraffic = 0.0;

  for (const item of devices) {
    const baseTraffic = item.data_per_hour * item.quantity;

    // Формула расчета с коэффициентами для разных типов устройств
    let coefficient = 1.0;
    
    if (item.device_name.includes('Хаб')) {
      coefficient = 1.3; // Хабы требуют больше трафика
    } else if (item.device_name.includes('Датчик')) {
      coefficient = 0.7; // Датчики экономят трафик
    } else if (item.device_name.includes('Лампочка')) {
      coefficient = 1.1; // Лампочки немного больше
    } else if (item.device_name.includes('Розетка')) {
      coefficient = 0.9; // Розетки мало трафика
    } else if (item.device_name.includes('Выключатель')) {
      coefficient = 0.8; // Выключатели мало трафика
    }

    const traffic = baseTraffic * coefficient;
    totalTraffic += traffic;
  }

  return totalTraffic;
}

@Injectable()
export class TrafficService {
  private readonly MAIN_SERVICE_URL = 'http://localhost:8080/api/traffic_result';
  private readonly SECRET_TOKEN = 'MY_SECRET_TOKEN_2025'; // Токен для авторизации

  async sendTrafficResult(data: RequestData) {
    // Задержка 5-10 секунд (имитация долгой операции)
    const delay = Math.random() * 5000 + 5000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Расчет трафика
    const totalTraffic = calculateTraffic(data.devices);

    console.log(`📊 Рассчитан трафик для заявки ${data.order_id}: ${totalTraffic.toFixed(2)} МБ/мес`);

    // Отправка результата в основной сервис
    try {
      await axios.put(this.MAIN_SERVICE_URL, {
        token: this.SECRET_TOKEN,
        order_id: data.order_id,
        total_traffic: totalTraffic,
      });
      console.log(`✅ Результат отправлен в основной сервис для заявки ${data.order_id}`);
    } catch (error) {
      console.error(`❌ Ошибка отправки результата:`, error.message);
    }
  }
}
