from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

import time
import random
import requests
from concurrent import futures

CALLBACK_URL = "http://localhost:8080/api/traffic_result"
SECRET_TOKEN = "MY_SECRET_TOKEN_2025"

executor = futures.ThreadPoolExecutor(max_workers=1)

def calculate_traffic(order_id, devices):
    """Расчет трафика с задержкой и формулой по типам устройств"""
    time.sleep(7)  # 7 секунд задержка
    
    total_traffic = 0.0
    for device in devices:
        base_traffic = device['data_per_hour'] * device['quantity']
        
        # Коэффициенты как в Go-сервисе
        device_name = device.get('device_name', '')
        if 'Хаб' in device_name:
            coefficient = 1.3
        elif 'Датчик' in device_name:
            coefficient = 0.7
        elif 'Лампочка' in device_name:
            coefficient = 1.1
        elif 'Розетка' in device_name:
            coefficient = 0.9
        elif 'Выключатель' in device_name:
            coefficient = 0.8
        else:
            coefficient = 1.0
        
        traffic = base_traffic * coefficient
        total_traffic += traffic
    
    return {
        "order_id": order_id,
        "total_traffic": round(total_traffic, 2),
    }

def traffic_callback(task):
    """Колбэк для отправки результата обратно в Go-сервис"""
    try:
        result = task.result()
        print(f"✅ Расчет завершен: Order {result['order_id']}, Traffic: {result['total_traffic']}")
    except futures._base.CancelledError:
        print("❌ Задача отменена")
        return
    except Exception as e:
        print(f"❌ Ошибка при расчете: {e}")
        return
    
    answer = {
        "token": SECRET_TOKEN,
        "order_id": result["order_id"],
        "total_traffic": result["total_traffic"]
    }
    
    try:
        resp = requests.put(CALLBACK_URL, json=answer, timeout=5)
        print(f"📤 Результат отправлен в Go-сервис. Статус: {resp.status_code}")
    except Exception as e:
        print(f"❌ Не удалось отправить результат: {e}")

@api_view(['POST'])
def calculate_traffic_async(request):
    """HTTP-метод для асинхронного расчета трафика"""
    if "order_id" not in request.data or "devices" not in request.data:
        return Response(
            {"error": "order_id and devices are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    order_id = request.data["order_id"]
    devices = request.data["devices"]
    
    print(f"🚀 Запущен асинхронный расчет для заявки #{order_id}")
    
    # Запускаем задачу в фоновом режиме
    task = executor.submit(calculate_traffic, order_id, devices)
    task.add_done_callback(traffic_callback)
    
    return Response(
        {"status": "ok", "message": "Calculation started"}, 
        status=status.HTTP_200_OK
    )
