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
	db               *gorm.DB
	tmplDevices      = template.Must(template.ParseFiles("templates/layout.html", "templates/devices.html"))
	tmplDeviceDetail = template.Must(template.ParseFiles("templates/layout.html", "templates/device_detail.html"))
	tmplRequest      = template.Must(template.ParseFiles("templates/layout.html", "templates/request.html"))
)

func Init(database *gorm.DB) {
	db = database
}

// GET /devices - поиск услуг через GORM
func DevicesHandler(w http.ResponseWriter, r *http.Request) {
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

	err := tmplDevices.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Devices": services,
		"Search":  search,
	})
	if err != nil {
		log.Printf("Template error in DevicesHandler: %v", err)
	}
}

// GET /devices/{id} - детальная страница устройства
func DeviceDetailHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/devices/"):]
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

	err = tmplDeviceDetail.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Device": device,
	})
	if err != nil {
		log.Printf("❌ Template error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GET /request - просмотр заявки
func RequestHandler(w http.ResponseWriter, r *http.Request) {
	// Ищем черновую заявку для пользователя ID 1 (демо)
	var request models.Request
	var items []models.RequestService

	db.Preload("Client").Where("status = ? AND client_id = ?", "draft", 1).First(&request)

	if request.ID != 0 {
		db.Preload("Service").Where("request_id = ?", request.ID).Find(&items)
	}

	err := tmplRequest.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Request": request,
		"Items":   items,
	})
	if err != nil {
		log.Printf("❌ Template error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// POST /request/add - добавление в заявку
func AddToRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	serviceID := r.FormValue("service_id")
	if serviceID == "" {
		http.Error(w, "Service ID is required", http.StatusBadRequest)
		return
	}

	// Заглушка для демонстрации
	log.Printf("➕ Add to cart: service_id=%s", serviceID)
	http.Redirect(w, r, "/request", http.StatusSeeOther)
}

// POST /request/delete - удаление заявки через RAW SQL (требование ТЗ)
func DeleteRequestHandler(w http.ResponseWriter, r *http.Request) {
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

	log.Printf("🗑️ Deleted request: id=%s", requestID)
	http.Redirect(w, r, "/request", http.StatusSeeOther)
}

// GET /request/count - количество товаров в корзине
func GetCartCountHandler(w http.ResponseWriter, r *http.Request) {
	var count int64

	db.Model(&models.RequestService{}).
		Joins("JOIN requests ON requests.id = request_services.request_id").
		Where("requests.client_id = ? AND requests.status = ?", 1, "draft").
		Count(&count)

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"count": ` + strconv.FormatInt(count, 10) + `}`))
}
