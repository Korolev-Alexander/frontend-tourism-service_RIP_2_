package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"smartdevices/internal/models"

	"gorm.io/gorm"
)

type OrderItemAPIHandler struct {
	db *gorm.DB
}

func NewOrderItemAPIHandler(db *gorm.DB) *OrderItemAPIHandler {
	return &OrderItemAPIHandler{db: db}
}

// PUT /api/order-items/{deviceId} - изменение количества
func (h *OrderItemAPIHandler) UpdateOrderItem(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := r.URL.Path[len("/api/order-items/"):]
	deviceID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
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

	var orderItem models.OrderItem
	result := h.db.Where("device_id = ?", deviceID).First(&orderItem)
	if result.Error != nil {
		http.Error(w, "Order item not found", http.StatusNotFound)
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
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := r.URL.Path[len("/api/order-items/"):]
	deviceID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	var orderItem models.OrderItem
	result := h.db.Where("device_id = ?", deviceID).First(&orderItem)
	if result.Error != nil {
		http.Error(w, "Order item not found", http.StatusNotFound)
		return
	}

	h.db.Delete(&orderItem)

	w.WriteHeader(http.StatusNoContent)
}
