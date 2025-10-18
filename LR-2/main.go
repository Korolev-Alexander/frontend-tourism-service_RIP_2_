package main

import (
	"log"
	"net/http"

	apiHandlers "smartdevices/internal/api/handlers" // API handlers с алиасом
	"smartdevices/internal/handlers"                 // HTML handlers

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Подключение к PostgreSQL через GORM
	dsn := "host=localhost user=root password=root dbname=RIP port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Ошибка подключения к БД:", err)
	}

	// Инициализация HTML handlers с передачей DB
	handlers.Init(db)

	// Инициализация API handlers
	smartDeviceAPI := apiHandlers.NewSmartDeviceAPIHandler(db)
	smartOrderAPI := apiHandlers.NewSmartOrderAPIHandler(db)
	orderItemAPI := apiHandlers.NewOrderItemAPIHandler(db)
	clientAPI := apiHandlers.NewClientAPIHandler(db)

	// Статические файлы
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Редирект с корневого пути на страницу устройств
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/smart-devices", http.StatusSeeOther)
			return
		}
		handlers.Show404Page(w, "Страница не найдена")
	})

	// HTML маршруты
	http.HandleFunc("/smart-devices", handlers.SmartDevicesHandler)
	http.HandleFunc("/smart-devices/", handlers.SmartDeviceDetailHandler)
	http.HandleFunc("/smart-cart", handlers.SmartCartHandler)
	http.HandleFunc("/smart-cart/add", handlers.AddToSmartCartHandler)
	http.HandleFunc("/smart-cart/delete", handlers.DeleteSmartCartHandler)
	http.HandleFunc("/smart-cart/count", handlers.GetSmartCartCountHandler)
	http.HandleFunc("/request/", handlers.RequestByIDHandler)

	// API маршруты - Smart Devices
	http.HandleFunc("/api/smart-devices", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			smartDeviceAPI.GetSmartDevices(w, r)
		case "POST":
			smartDeviceAPI.CreateSmartDevice(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/smart-devices/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			smartDeviceAPI.GetSmartDevice(w, r)
		case "PUT":
			smartDeviceAPI.UpdateSmartDevice(w, r)
		case "DELETE":
			smartDeviceAPI.DeleteSmartDevice(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// API маршруты - Smart Orders
	http.HandleFunc("/api/smart-orders/cart", smartOrderAPI.GetCart)
	http.HandleFunc("/api/smart-orders", smartOrderAPI.GetSmartOrders)
	http.HandleFunc("/api/smart-orders/", smartOrderAPI.GetSmartOrder)
	http.HandleFunc("/api/smart-orders/form", smartOrderAPI.FormSmartOrder)
	http.HandleFunc("/api/smart-orders/complete", smartOrderAPI.CompleteSmartOrder)

	// API маршруты - Order Items
	http.HandleFunc("/api/order-items/", orderItemAPI.UpdateOrderItem)
	http.HandleFunc("/api/order-items/delete", orderItemAPI.DeleteOrderItem)

	// API маршруты - Clients
	http.HandleFunc("/api/clients", clientAPI.GetClients)
	http.HandleFunc("/api/clients/", clientAPI.GetClient)
	http.HandleFunc("/api/clients/register", clientAPI.CreateClient)
	http.HandleFunc("/api/clients/update", clientAPI.UpdateClient)

	log.Println("🚀 Сервер запущен на http://localhost:8080")
	log.Println("📱 HTML интерфейс доступен")
	log.Println("🔗 API доступно (21 метод):")

	log.Println("📦 Smart Devices API:")
	log.Println("   GET    /api/smart-devices              - список устройств")
	log.Println("   GET    /api/smart-devices/{id}         - устройство по ID")
	log.Println("   POST   /api/smart-devices              - создать устройство")
	log.Println("   PUT    /api/smart-devices/{id}         - обновить устройство")
	log.Println("   DELETE /api/smart-devices/{id}         - удалить устройство")
	log.Println("   POST   /api/smart-devices/{id}/image   - загрузить картинку")

	log.Println("📋 Smart Orders API:")
	log.Println("   GET    /api/smart-orders/cart          - корзина")
	log.Println("   GET    /api/smart-orders               - список заявок")
	log.Println("   GET    /api/smart-orders/{id}          - заявка по ID")
	log.Println("   PUT    /api/smart-orders/{id}          - обновить заявку")
	log.Println("   PUT    /api/smart-orders/{id}/form     - сформировать заявку")
	log.Println("   PUT    /api/smart-orders/{id}/complete - завершить заявку")
	log.Println("   DELETE /api/smart-orders/{id}          - удалить заявку")

	log.Println("🛒 Order Items API:")
	log.Println("   PUT    /api/order-items/{deviceId}     - изменить количество")
	log.Println("   DELETE /api/order-items/{deviceId}     - удалить из заявки")

	log.Println("👥 Clients API:")
	log.Println("   GET    /api/clients                    - список клиентов")
	log.Println("   GET    /api/clients/{id}               - клиент по ID")
	log.Println("   POST   /api/clients/register           - регистрация")
	log.Println("   PUT    /api/clients/update             - обновить данные")
	log.Println("   POST   /api/clients/login              - аутентификация")
	log.Println("   POST   /api/clients/logout             - деавторизация")

	log.Println("🎯 Всего методов: 21")

	// ⚠️ ЭТА СТРОЧКА ОБЯЗАТЕЛЬНА! - запускает HTTP сервер
	http.ListenAndServe(":8080", nil)
}
