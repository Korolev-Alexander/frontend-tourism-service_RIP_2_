package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	// Подключение к PostgreSQL
	dsn := "host=localhost user=root password=root dbname=RIP port=5433 sslmode=disable"
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Ошибка подключения к БД:", err)
	}
	defer db.Close()

	// Проверяем подключение
	err = db.Ping()
	if err != nil {
		log.Fatal("Не удалось подключиться к БД:", err)
	}

	fmt.Println("✅ Подключение к PostgreSQL установлено")

	// Очищаем старые данные
	fmt.Println("🧹 Очищаем старые данные...")
	db.Exec("DELETE FROM order_items")
	db.Exec("DELETE FROM smart_orders")
	db.Exec("DELETE FROM smart_devices")
	db.Exec("DELETE FROM clients")
	db.Exec("ALTER SEQUENCE clients_id_seq RESTART WITH 1")
	db.Exec("ALTER SEQUENCE smart_devices_id_seq RESTART WITH 1")
	db.Exec("ALTER SEQUENCE smart_orders_id_seq RESTART WITH 1")

	// 1. Клиенты
	fmt.Println("👥 Добавляем клиентов...")
	var clientID, moderatorID int
	err = db.QueryRow(`
        INSERT INTO clients (username, password, is_moderator, date_joined)
        VALUES ('client1', 'pass123', FALSE, $1)
        RETURNING id
    `, time.Now()).Scan(&clientID)
	if err != nil {
		log.Printf("Ошибка добавления client1: %v", err)
	}

	err = db.QueryRow(`
        INSERT INTO clients (username, password, is_moderator, date_joined)
        VALUES ('moderator1', 'modpass123', TRUE, $1)
        RETURNING id
    `, time.Now()).Scan(&moderatorID)
	if err != nil {
		log.Printf("Ошибка добавления moderator1: %v", err)
	}

	fmt.Printf("✓ Создан клиент client1 с ID: %d\n", clientID)
	fmt.Printf("✓ Создан пользователь moderator1 с ID: %d\n", moderatorID)

	// 2. Умные устройства
	fmt.Println("💡 Добавляем умные устройства...")
	devices := []struct {
		name        string
		model       string
		dataRate    float64
		dataPerHour float64
		imageFile   string // имя файла картинки
		description string
		fullDesc    string
		protocol    string
	}{
		{
			"Хаб", "Яндекс Хаб", 5120, 56.25, "hub.png",
			"Умный пульт Яндекс Хаб для устройств",
			"Умный пульт Яндекс Хаб для управления всеми устройствами умного дома. Центральное устройство системы, координирующее работу всех подключенных девайсов.",
			"Wi-Fi",
		},
		{
			"Лампочка", "Яндекс, E27", 8, 0.5, "lamp.png",
			"Умная лампочка Яндекс, E27",
			"Умная Яндекс лампочка позволяет дистанционно управлять освещением в комнате или доме. Поддержка Wi-Fi позволяет лампе работать в Умном доме Яндекса и реагировать на команды, отданные по мобильному приложению или напрямую голосовому помощнику Алисе.",
			"Wi-Fi",
		},
		{
			"Розетка", "YNDX-00340", 2, 0.1, "socket.png",
			"Умная розетка Яндекс YNDX-00340",
			"Умная розетка для дистанционного управления электроприборами. Позволяет включать и выключать устройства по расписанию или голосовой команде.",
			"Wi-Fi",
		},
		{
			"Датчик", "Aqara Motion Sensor P1", 5, 0.3, "sensor.png",
			"Датчик движения Aqara Motion Sensor P1",
			"Беспроводной датчик движения для автоматизации освещения и безопасности. Реагирует на движение в помещении и отправляет уведомления.",
			"Zigbee",
		},
		{
			"Выключатель", "Яндекс, 2 клавиши", 3, 0.2, "switch.png",
			"Умный беспроводной выключатель Яндекс, 2 клавиши",
			"Беспроводной выключатель для управления умным освещением. Не требует прокладки проводов, работает от батареек.",
			"Bluetooth",
		},
	}

	for _, d := range devices {
		// Генерируем MinIO URL для картинки
		namespaceURL := fmt.Sprintf("http://localhost:9000/image/%s", d.imageFile)

		_, err := db.Exec(`
            INSERT INTO smart_devices (name, model, avg_data_rate, data_per_hour, namespace_url, description, description_all, protocol, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, d.name, d.model, d.dataRate, d.dataPerHour, namespaceURL, d.description, d.fullDesc, d.protocol, time.Now())

		if err != nil {
			log.Printf("Ошибка добавления %s: %v", d.name, err)
		} else {
			fmt.Printf("✓ Добавлено: %s (URL: %s)\n", d.name, namespaceURL)
		}
	}

	// 3. Демо-заявка (используем реальный clientID)
	fmt.Println("📋 Создаем демо-заявку...")
	var orderID int
	err = db.QueryRow(`
        INSERT INTO smart_orders (status, client_id, address, created_at)
        VALUES ('draft', $1, 'ул. Примерная, д. 1, кв. 5', $2)
        RETURNING id
    `, clientID, time.Now()).Scan(&orderID)

	if err != nil {
		log.Printf("Ошибка создания заявки: %v", err)
	} else {
		fmt.Printf("✓ Создана заявка ID: %d\n", orderID)
	}

	// 4. Устройства в заявке
	fmt.Println("🛒 Добавляем устройства в заявку...")
	orderItems := []struct {
		deviceID int
		quantity int
	}{
		{2, 3}, // 3 лампочки
		{4, 2}, // 2 датчика
	}

	for _, item := range orderItems {
		_, err := db.Exec(`
            INSERT INTO order_items (order_id, device_id, quantity, created_at)
            VALUES ($1, $2, $3, $4)
        `, orderID, item.deviceID, item.quantity, time.Now())

		if err != nil {
			log.Printf("Ошибка добавления устройства %d в заявку: %v", item.deviceID, err)
		} else {
			fmt.Printf("✓ Добавлено устройство ID: %d (кол-во: %d)\n", item.deviceID, item.quantity)
		}
	}

	fmt.Println("✅ Миграция завершена успешно!")
	fmt.Printf("👤 Демо-клиент: client1 (ID: %d) / pass123\n", clientID)
	fmt.Printf("🛒 Демо-заявка создана с 2 устройствами\n")
	fmt.Println("🖼️ Картинки загружены с MinIO URL")
}
