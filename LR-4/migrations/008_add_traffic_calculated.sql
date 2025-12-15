-- Добавление поля traffic_calculated в таблицу smart_orders
ALTER TABLE smart_orders 
ADD COLUMN traffic_calculated BOOLEAN DEFAULT FALSE;

-- Обновляем существующие завершенные заявки
UPDATE smart_orders 
SET traffic_calculated = TRUE 
WHERE status = 'completed' AND total_traffic > 0;
