package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"smartdevices/internal/middleware"
	"smartdevices/internal/models"

	"gorm.io/gorm"
)

type OrderItemAPIHandler struct {
	db             *gorm.DB
	authMiddleware *middleware.AuthMiddleware
}

func NewOrderItemAPIHandler(db *gorm.DB) *OrderItemAPIHandler {
	return &OrderItemAPIHandler{
		db:             db,
		authMiddleware: middleware.NewAuthMiddleware(db),
	}
}

// POST /api/order-items - добавление устройства в корзину
func (h *OrderItemAPIHandler) AddOrderItem(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя
	currentUser := h.authMiddleware.GetCurrentUser(r)
	if currentUser == nil {
		http.Error(w, `{"error": "Authentication required"}`, http.StatusUnauthorized)
		return
	}

	// Проверяем: модератор не может создавать заявки
	if currentUser.IsModerator {
		log.Printf("❌ Модератор (ID: %d) попытался добавить устройство в корзину", currentUser.ClientID)
		http.Error(w, `{"error": "Модераторы не могут создавать заявки"}`, http.StatusForbidden)
		return
	}

	var request struct {
		DeviceID int `json:"device_id"`
		Quantity int `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.Quantity <= 0 {
		request.Quantity = 1
	}

	// Проверяем существование устройства
	var device models.SmartDevice
	if result := h.db.First(&device, request.DeviceID); result.Error != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	// Ищем или создаем черновую заявку
	var order models.SmartOrder
	result := h.db.Where("status = ? AND client_id = ?", "draft", currentUser.ClientID).First(&order)

	if result.Error != nil {
		// Создаем новую корзину
		order = models.SmartOrder{
			Status:   "draft",
			ClientID: currentUser.ClientID,
		}
		h.db.Create(&order)
		log.Printf("📝 Создана новая корзина ID: %d для пользователя %d", order.ID, currentUser.ClientID)
	}

	// Ищем существующий OrderItem
	var existingOrderItem models.OrderItem
	findResult := h.db.Where("order_id = ? AND device_id = ?", order.ID, request.DeviceID).First(&existingOrderItem)

	if findResult.Error == nil {
		// Увеличиваем количество
		existingOrderItem.Quantity += request.Quantity
		h.db.Save(&existingOrderItem)
		log.Printf("➕ Увеличено количество устройства %d в корзине %d: %d шт.", request.DeviceID, order.ID, existingOrderItem.Quantity)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"order_id":  order.ID,
			"device_id": existingOrderItem.DeviceID,
			"quantity":  existingOrderItem.Quantity,
			"updated":   true,
		})
	} else {
		// Создаем новый OrderItem
		orderItem := models.OrderItem{
			OrderID:  order.ID,
			DeviceID: uint(request.DeviceID),
			Quantity: request.Quantity,
		}
		h.db.Create(&orderItem)
		log.Printf("🆕 Добавлено устройство %d в корзину %d", request.DeviceID, order.ID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"order_id":  order.ID,
			"device_id": orderItem.DeviceID,
			"quantity":  orderItem.Quantity,
			"created":   true,
		})
	}
}

// PUT /api/order-items/{deviceId} - изменение количества
func (h *OrderItemAPIHandler) UpdateOrderItem(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя
	currentUser := h.authMiddleware.GetCurrentUser(r)
	if currentUser == nil {
		http.Error(w, `{"error": "Authentication required"}`, http.StatusUnauthorized)
		return
	}

	// Проверяем: модератор не может изменять заявки
	if currentUser.IsModerator {
		log.Printf("❌ Модератор (ID: %d) попытался изменить количество устройства в корзине", currentUser.ClientID)
		http.Error(w, `{"error": "Модераторы не могут изменять заявки"}`, http.StatusForbidden)
		return
	}

	idStr := r.URL.Path[len("/api/order-items/"):]
	deviceID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	// Находим текущую корзину пользователя
	var order models.SmartOrder
	result := h.db.Where("status = ? AND client_id = ?", "draft", currentUser.ClientID).First(&order)
	if result.Error != nil {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	var request struct {
		Quantity int `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.Quantity <= 0 {
		http.Error(w, "Quantity must be positive", http.StatusBadRequest)
		return
	}

	// Ищем устройство ИМЕННО в этой корзине
	var orderItem models.OrderItem
	result = h.db.Where("order_id = ? AND device_id = ?", order.ID, deviceID).First(&orderItem)
	if result.Error != nil {
		http.Error(w, "Device not found in cart", http.StatusNotFound)
		return
	}

	orderItem.Quantity = request.Quantity
	h.db.Save(&orderItem)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"device_id": orderItem.DeviceID,
		"quantity":  orderItem.Quantity,
		"updated":   true,
	})
}

// DELETE /api/order-items/{deviceId} - удаление из заявки
func (h *OrderItemAPIHandler) DeleteOrderItem(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя
	currentUser := h.authMiddleware.GetCurrentUser(r)
	if currentUser == nil {
		http.Error(w, `{"error": "Authentication required"}`, http.StatusUnauthorized)
		return
	}

	// Проверяем: модератор не может удалять устройства из заявок
	if currentUser.IsModerator {
		log.Printf("❌ Модератор (ID: %d) попытался удалить устройство из корзины", currentUser.ClientID)
		http.Error(w, `{"error": "Модераторы не могут изменять заявки"}`, http.StatusForbidden)
		return
	}

	// ДОБАВИМ ОТЛАДКУ
	path := r.URL.Path
	log.Printf("🛠️ DeleteOrderItem path: %s", path)

	idStr := r.URL.Path[len("/api/order-items/"):]
	log.Printf("🛠️ DeleteOrderItem idStr: %s", idStr)

	deviceID, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("❌ Error converting deviceID: %v", err)
		http.Error(w, "Invalid device ID: "+err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("🛠️ DeleteOrderItem deviceID: %d", deviceID)

	// Находим текущую корзину пользователя
	var order models.SmartOrder
	result := h.db.Where("status = ? AND client_id = ?", "draft", currentUser.ClientID).First(&order)
	if result.Error != nil {
		log.Printf("❌ Cart not found: %v", result.Error)
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	log.Printf("🛠️ Found cart: ID=%d", order.ID)

	// Удаляем устройство ИЗ ЭТОЙ КОРЗИНЫ
	var orderItem models.OrderItem
	result = h.db.Where("order_id = ? AND device_id = ?", order.ID, deviceID).First(&orderItem)
	if result.Error != nil {
		log.Printf("❌ Device %d not found in cart %d: %v", deviceID, order.ID, result.Error)
		http.Error(w, "Device not found in cart", http.StatusNotFound)
		return
	}

	log.Printf("🛠️ Deleting device %d from cart %d", deviceID, order.ID)
	h.db.Delete(&orderItem)

	w.WriteHeader(http.StatusNoContent)
}
