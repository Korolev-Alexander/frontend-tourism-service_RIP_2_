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
	dsn := "host=localhost user=root password=root dbname=RIP port=5432 sslmode=disable"
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
	db.Exec("DELETE FROM request_services")
	db.Exec("DELETE FROM requests")
	db.Exec("DELETE FROM services")
	db.Exec("DELETE FROM users")
	db.Exec("ALTER SEQUENCE users_id_seq RESTART WITH 1")
	db.Exec("ALTER SEQUENCE services_id_seq RESTART WITH 1")
	db.Exec("ALTER SEQUENCE requests_id_seq RESTART WITH 1")

	// 1. Пользователи
	fmt.Println("👥 Добавляем пользователей...")
	var clientID, moderatorID int
	err = db.QueryRow(`
		INSERT INTO users (username, password, is_moderator, date_joined) 
		VALUES ('client1', 'pass123', FALSE, $1) 
		RETURNING id
	`, time.Now()).Scan(&clientID)
	if err != nil {
		log.Printf("Ошибка добавления client1: %v", err)
	}

	err = db.QueryRow(`
		INSERT INTO users (username, password, is_moderator, date_joined) 
		VALUES ('moderator1', 'modpass123', TRUE, $1) 
		RETURNING id
	`, time.Now()).Scan(&moderatorID)
	if err != nil {
		log.Printf("Ошибка добавления moderator1: %v", err)
	}

	fmt.Printf("✓ Создан пользователь client1 с ID: %d\n", clientID)
	fmt.Printf("✓ Создан пользователь moderator1 с ID: %d\n", moderatorID)

	// 2. Услуги (твои устройства из 1 лабы)
	fmt.Println("💡 Добавляем услуги...")
	services := []struct {
		name        string
		model       string
		dataRate    float64
		dataPerHour float64
		image       string
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

	for _, s := range services {
		// Генерируем MinIO URL для картинки
		imageURL := fmt.Sprintf("http://localhost:9000/images/%s", s.image)

		_, err := db.Exec(`
			INSERT INTO services (name, model, avg_data_rate, data_per_hour, image_url, description, description_all, protocol, created_at) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, s.name, s.model, s.dataRate, s.dataPerHour, imageURL, s.description, s.fullDesc, s.protocol, time.Now())

		if err != nil {
			log.Printf("Ошибка добавления %s: %v", s.name, err)
		} else {
			fmt.Printf("✓ Добавлено: %s\n", s.name)
		}
	}

	// 3. Демо-заявка (используем реальный clientID)
	fmt.Println("📋 Создаем демо-заявку...")
	var requestID int
	err = db.QueryRow(`
		INSERT INTO requests (status, client_id, address, created_at) 
		VALUES ('draft', $1, 'ул. Примерная, д. 1, кв. 5', $2)
		RETURNING id
	`, clientID, time.Now()).Scan(&requestID)

	if err != nil {
		log.Printf("Ошибка создания заявки: %v", err)
	} else {
		fmt.Printf("✓ Создана заявка ID: %d\n", requestID)
	}

	// 4. Услуги в заявке
	fmt.Println("🛒 Добавляем услуги в заявку...")
	requestServices := []struct {
		serviceID int
		quantity  int
	}{
		{2, 3}, // 3 лампочки
		{4, 2}, // 2 датчика
	}

	for _, rs := range requestServices {
		_, err := db.Exec(`
			INSERT INTO request_services (request_id, service_id, quantity, created_at) 
			VALUES ($1, $2, $3, $4)
		`, requestID, rs.serviceID, rs.quantity, time.Now())

		if err != nil {
			log.Printf("Ошибка добавления услуги %d в заявку: %v", rs.serviceID, err)
		} else {
			fmt.Printf("✓ Добавлена услуга ID: %d (кол-во: %d)\n", rs.serviceID, rs.quantity)
		}
	}

	fmt.Println("✅ Миграция завершена успешно!")
	fmt.Printf("👤 Демо-пользователь: client1 (ID: %d) / pass123\n", clientID)
	fmt.Println("🛒 Демо-заявка создана с 2 услугами")
}
