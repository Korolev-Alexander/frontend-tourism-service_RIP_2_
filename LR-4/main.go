package main

import (
	"log"
	"net/http"
	"strings"

	apiHandlers "smartdevices/internal/api/handlers"
	"smartdevices/internal/handlers"
	"smartdevices/internal/middleware"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Подключение к PostgreSQL через GORM
	dsn := "host=localhost user=root password=root dbname=RIP port=5433 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Ошибка подключения к БД:", err)
	}

	// Инициализация HTML handlers с передачей DB
	handlers.Init(db)

	// Инициализация middleware
	authMiddleware := middleware.NewAuthMiddleware(db)

	// Инициализация API handlers
	smartDeviceAPI := apiHandlers.NewSmartDeviceAPIHandler(db)
	smartOrderAPI := apiHandlers.NewSmartOrderAPIHandler(db)
	orderItemAPI := apiHandlers.NewOrderItemAPIHandler(db)
	clientAPI := apiHandlers.NewClientAPIHandler(db)

	// Статические файлы
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Главная страница - сразу показываем устройства
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			handlers.SmartDevicesHandler(w, r)
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

	// API маршруты аутентификации
	http.HandleFunc("/api/auth/login", authMiddleware.Login)
	http.HandleFunc("/api/auth/logout", authMiddleware.Logout)
	http.HandleFunc("/api/auth/session", authMiddleware.GetSessionInfo)
	http.HandleFunc("/api/auth/sessions", authMiddleware.RequireModerator(authMiddleware.GetAllSessions))

	// НОВЫЕ LUA-ENDPOINTS для отображения пользователей
	http.HandleFunc("/api/auth/users-info", authMiddleware.RequireModerator(authMiddleware.GetUsersInfo))
	http.HandleFunc("/api/auth/session-stats", authMiddleware.RequireModerator(authMiddleware.GetSessionStats))

	// API маршруты - Smart Devices
	http.HandleFunc("/api/smart-devices", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			smartDeviceAPI.GetSmartDevices(w, r)
		case http.MethodPost:
			authMiddleware.RequireModerator(smartDeviceAPI.CreateSmartDevice)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Обработка всех /api/smart-devices/... маршрутов
	http.HandleFunc("/api/smart-devices/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		switch {
		case strings.Contains(path, "/image"):
			switch r.Method {
			case http.MethodPost:
				authMiddleware.RequireModerator(smartDeviceAPI.UploadDeviceImage)(w, r)
			case http.MethodDelete:
				authMiddleware.RequireModerator(smartDeviceAPI.DeleteDeviceImage)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		default:
			// Обычные CRUD операции
			switch r.Method {
			case http.MethodGet:
				smartDeviceAPI.GetSmartDevice(w, r)
			case http.MethodPut:
				authMiddleware.RequireModerator(smartDeviceAPI.UpdateSmartDevice)(w, r)
			case http.MethodDelete:
				authMiddleware.RequireModerator(smartDeviceAPI.DeleteSmartDevice)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	})

	// API маршруты - Smart Orders
	http.HandleFunc("/api/smart-orders/cart", authMiddleware.RequireAuth(smartOrderAPI.GetCart))
	http.HandleFunc("/api/smart-orders", authMiddleware.RequireAuth(smartOrderAPI.GetSmartOrders))

	// Обработка всех /api/smart-orders/... маршрутов
	http.HandleFunc("/api/smart-orders/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		switch {
		case strings.Contains(path, "/complete"):
			if r.Method == http.MethodPut {
				authMiddleware.RequireModerator(smartOrderAPI.CompleteSmartOrder)(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		case strings.Contains(path, "/form"):
			if r.Method == http.MethodPut {
				authMiddleware.RequireAuth(smartOrderAPI.FormSmartOrder)(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		default:
			// Обычные CRUD операции
			switch r.Method {
			case http.MethodGet:
				authMiddleware.RequireAuth(smartOrderAPI.GetSmartOrder)(w, r)
			case http.MethodPut:
				authMiddleware.RequireAuth(smartOrderAPI.UpdateSmartOrder)(w, r)
			case http.MethodDelete:
				authMiddleware.RequireAuth(smartOrderAPI.DeleteSmartOrder)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	})

	// API маршруты - Order Items
	http.HandleFunc("/api/order-items/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			authMiddleware.RequireAuth(orderItemAPI.UpdateOrderItem)(w, r)
		case http.MethodDelete:
			authMiddleware.RequireAuth(orderItemAPI.DeleteOrderItem)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// API маршруты - Clients
	http.HandleFunc("/api/clients/login", clientAPI.Login)
	http.HandleFunc("/api/clients/logout", clientAPI.Logout)
	http.HandleFunc("/api/clients/register", clientAPI.CreateClient)
	http.HandleFunc("/api/clients/update", authMiddleware.RequireAuth(clientAPI.UpdateClient))
	http.HandleFunc("/api/clients/", authMiddleware.RequireModerator(clientAPI.GetClient))
	http.HandleFunc("/api/clients", authMiddleware.RequireModerator(clientAPI.GetClients))

	log.Println("🚀 Сервер запущен на http://localhost:8080")
	log.Println("📱 HTML интерфейс доступен")
	log.Println("🔐 Auth system initialized")
	log.Println("🍪 Session storage: Redis")
	log.Println("👥 User roles: client/moderator")
	log.Println("🔮 Redis Lua scripts enabled")

	log.Println("🔐 Auth API:")
	log.Println("   POST   /api/auth/login              - аутентификация")
	log.Println("   POST   /api/auth/logout             - выход")
	log.Println("   GET    /api/auth/session            - информация о сессии")
	log.Println("   GET    /api/auth/sessions           - все сессии (модератор)")
	log.Println("   GET    /api/auth/users-info         - пользователи через Lua (модератор)")
	log.Println("   GET    /api/auth/session-stats      - статистика сессий через Lua (модератор)")

	log.Println("📦 Smart Devices API:")
	log.Println("   GET    /api/smart-devices           - список устройств")
	log.Println("   GET    /api/smart-devices/{id}      - устройство по ID")
	log.Println("   POST   /api/smart-devices           - создать устройство (модератор)")
	log.Println("   PUT    /api/smart-devices/{id}      - обновить устройство (модератор)")
	log.Println("   DELETE /api/smart-devices/{id}      - удалить устройство (модератор)")
	log.Println("   POST   /api/smart-devices/{id}/image - загрузить картинку (модератор)")
	log.Println("   DELETE /api/smart-devices/{id}/image - удалить картинку (модератор)")

	log.Println("📋 Smart Orders API:")
	log.Println("   GET    /api/smart-orders/cart       - корзина (требует auth)")
	log.Println("   GET    /api/smart-orders            - список заявок (требует auth)")
	log.Println("   GET    /api/smart-orders/{id}       - заявка по ID (требует auth)")
	log.Println("   PUT    /api/smart-orders/{id}       - обновить заявку (требует auth)")
	log.Println("   PUT    /api/smart-orders/{id}/form  - сформировать заявку (требует auth)")
	log.Println("   PUT    /api/smart-orders/{id}/complete - завершить заявку (модератор)")
	log.Println("   DELETE /api/smart-orders/{id}       - удалить заявку (требует auth)")

	log.Println("🛒 Order Items API:")
	log.Println("   PUT    /api/order-items/{deviceId}  - изменить количество (требует auth)")
	log.Println("   DELETE /api/order-items/{deviceId}  - удалить из заявки (требует auth)")

	log.Println("👥 Clients API:")
	log.Println("   GET    /api/clients                 - список клиентов (модератор)")
	log.Println("   GET    /api/clients/{id}            - клиент по ID (модератор)")
	log.Println("   POST   /api/clients/register        - регистрация")
	log.Println("   PUT    /api/clients/update          - обновить данные (требует auth)")
	log.Println("   POST   /api/clients/login           - аутентификация")
	log.Println("   POST   /api/clients/logout          - деавторизация")

	log.Println("🎯 Всего методов: 28")

	// ⚠️ ЭТА СТРОЧКА ОБЯЗАТЕЛЬНА! - запускает HTTP сервер
	http.ListenAndServe(":8080", nil)
}
