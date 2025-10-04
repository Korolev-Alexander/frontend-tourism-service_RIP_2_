package handlers

import (
	"html/template"
	"log"
	"net/http"
	"strconv"

	"smartdevices/internal/models"

	"gorm.io/gorm"
)

var (
	db                    *gorm.DB
	tmplSmartDevices      = template.Must(template.ParseFiles("templates/layout.html", "templates/smart_devices.html"))
	tmplSmartDeviceDetail = template.Must(template.ParseFiles("templates/layout.html", "templates/smart_device_detail.html"))
	tmplSmartCart         = template.Must(template.ParseFiles("templates/layout.html", "templates/smart_cart.html"))
)

func Init(database *gorm.DB) {
	db = database
}

// Вспомогательная функция для получения количества товаров
func getSmartCartCount(clientID uint) int64 {
	var count int64
	db.Model(&models.RequestService{}).
		Joins("JOIN requests ON requests.id = request_services.request_id").
		Where("requests.client_id = ? AND requests.status = ?", clientID, "draft").
		Count(&count)
	return count
}

// Вспомогательная функция для расчета общего трафика
func calculateTotalTraffic(requestID uint) float64 {
	var total float64

	// Суммируем трафик всех устройств в корзине
	db.Model(&models.RequestService{}).
		Select("SUM(services.data_per_hour * request_services.quantity)").
		Joins("JOIN services ON services.id = request_services.service_id").
		Where("request_services.request_id = ?", requestID).
		Scan(&total)

	return total
}

// GET /smart-devices - поиск устройств через GORM
func SmartDevicesHandler(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")

	var services []models.Service
	query := db.Where("is_active = ?", true)

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	result := query.Find(&services)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	err := tmplSmartDevices.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Devices":   services,
		"Search":    search,
		"ShowCart":  true,
		"CartCount": getSmartCartCount(1),
	})

	if err != nil {
		log.Printf("Template error in SmartDevicesHandler: %v", err)
	}
}

// GET /smart-devices/{id} - детальная страница устройства
func SmartDeviceDetailHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/smart-devices/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	var device models.Service
	result := db.First(&device, id)
	if result.Error != nil {
		http.NotFound(w, r)
		return
	}

	log.Printf("📱 Device Detail - ID: %d, Name: %s, ImageURL: %s", device.ID, device.Name, device.ImageURL)

	err = tmplSmartDeviceDetail.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Device":    device,
		"ShowCart":  false,
		"CartCount": getSmartCartCount(1),
	})

	if err != nil {
		log.Printf("❌ Template error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GET /smart-cart - просмотр корзины
func SmartCartHandler(w http.ResponseWriter, r *http.Request) {
	// Ищем черновую корзину для пользователя ID 1 (демо)
	var request models.Request
	var items []models.RequestService

	db.Preload("Client").Where("status = ? AND client_id = ?", "draft", 1).First(&request)

	if request.ID != 0 {
		db.Preload("Service").Where("request_id = ?", request.ID).Find(&items)

		// РАССЧИТЫВАЕМ ОБЩИЙ ТРАФИК
		request.TotalTraffic = calculateTotalTraffic(request.ID)
	}

	err := tmplSmartCart.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Request":   request,
		"Items":     items,
		"ShowCart":  false,
		"CartCount": getSmartCartCount(1),
	})

	if err != nil {
		log.Printf("❌ Template error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// POST /smart-cart/add - добавление в корзину
func AddToSmartCartHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	serviceID := r.FormValue("service_id")
	if serviceID == "" {
		http.Error(w, "Service ID is required", http.StatusBadRequest)
		return
	}

	// КОНВЕРТИРУЕМ ID
	sID, err := strconv.Atoi(serviceID)
	if err != nil {
		http.Error(w, "Invalid service ID", http.StatusBadRequest)
		return
	}

	// 1. НАХОДИМ ИЛИ СОЗДАЕМ ЧЕРНОВУЮ КОРЗИНУ
	var request models.Request
	result := db.Where("status = ? AND client_id = ?", "draft", 1).First(&request)

	if result.Error != nil {
		// СОЗДАЕМ НОВУЮ КОРЗИНУ
		request = models.Request{
			Status:   "draft",
			ClientID: 1,
			Address:  "ул. Примерная, д. 1, кв. 5",
		}
		db.Create(&request)
	}

	// 2. ПРОВЕРЯЕМ, ЕСТЬ ЛИ УЖЕ ТАКАЯ УСЛУГА В КОРЗИНЕ
	var existingRequestService models.RequestService
	findResult := db.Where("request_id = ? AND service_id = ?", request.ID, sID).First(&existingRequestService)

	if findResult.Error == nil {
		// УСЛУГА УЖЕ ЕСТЬ - УВЕЛИЧИВАЕМ КОЛИЧЕСТВО
		existingRequestService.Quantity++
		db.Save(&existingRequestService)
	} else {
		// УСЛУГИ НЕТ - СОЗДАЕМ НОВУЮ
		requestService := models.RequestService{
			RequestID: request.ID,
			ServiceID: uint(sID),
			Quantity:  1,
		}
		db.Create(&requestService)
	}

	// 3. РЕДИРЕКТ В КОРЗИНУ
	http.Redirect(w, r, "/smart-cart", http.StatusSeeOther)
}

// POST /smart-cart/delete - удаление корзины через RAW SQL (требование ТЗ)
func DeleteSmartCartHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	requestID := r.FormValue("request_id")
	if requestID == "" {
		http.Error(w, "Request ID is required", http.StatusBadRequest)
		return
	}

	// ВЫПОЛНЯЕМ ТРЕБОВАНИЕ ТЗ: RAW SQL UPDATE
	sqlDB, err := db.DB()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	_, err = sqlDB.Exec("UPDATE requests SET status = 'deleted' WHERE id = $1", requestID)
	if err != nil {
		http.Error(w, "Error deleting request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("🗑️ Deleted cart: id=%s", requestID)
	// РЕДИРЕКТ НА СТРАНИЦУ УСТРОЙСТВ ПОСЛЕ УДАЛЕНИЯ
	http.Redirect(w, r, "/smart-devices", http.StatusSeeOther)
}

// GET /smart-cart/count - количество товаров в корзине
func GetSmartCartCountHandler(w http.ResponseWriter, r *http.Request) {
	var count int64

	db.Model(&models.RequestService{}).
		Joins("JOIN requests ON requests.id = request_services.request_id").
		Where("requests.client_id = ? AND requests.status = ?", 1, "draft").
		Count(&count)

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"count": ` + strconv.FormatInt(count, 10) + `}`))
}
