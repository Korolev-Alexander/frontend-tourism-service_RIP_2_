package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"smartdevices/internal/api/serializers"
	"smartdevices/internal/models"

	"gorm.io/gorm"
)

type SmartOrderAPIHandler struct {
	db *gorm.DB
}

func NewSmartOrderAPIHandler(db *gorm.DB) *SmartOrderAPIHandler {
	return &SmartOrderAPIHandler{db: db}
}

// GET /api/smart-orders/cart - иконка корзины
func (h *SmartOrderAPIHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	clientID := uint(1) // Фиксированный пользователь для демо

	var order models.SmartOrder
	result := h.db.Where("status = ? AND client_id = ?", "draft", clientID).First(&order)

	var response struct {
		OrderID uint `json:"order_id"`
		Count   int  `json:"count"`
	}

	if result.Error != nil {
		response.OrderID = 0
		response.Count = 0
	} else {
		response.OrderID = order.ID
		var totalQuantity struct {
			Total int
		}
		h.db.Model(&models.OrderItem{}).
			Select("SUM(quantity) as total").
			Where("order_id = ?", order.ID).
			Scan(&totalQuantity)

		response.Count = totalQuantity.Total
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /api/smart-orders - список заявок (кроме удаленных и черновика)
func (h *SmartOrderAPIHandler) GetSmartOrders(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	status := r.URL.Query().Get("status")
	dateFromStr := r.URL.Query().Get("date_from")
	dateToStr := r.URL.Query().Get("date_to")

	var orders []models.SmartOrder
	query := h.db.Preload("Client").Preload("Moderator").
		Where("status != ? AND status != ?", "deleted", "draft")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			query = query.Where("formed_at >= ?", dateFrom)
		}
	}

	if dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			query = query.Where("formed_at <= ?", dateTo.AddDate(0, 0, 1))
		}
	}

	result := query.Find(&orders)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	var response []serializers.SmartOrderResponse
	for _, order := range orders {
		var items []models.OrderItem
		h.db.Preload("Device").Where("order_id = ?", order.ID).Find(&items)

		var itemResponses []serializers.SmartOrderItemResponse
		for _, item := range items {
			itemResponses = append(itemResponses, serializers.SmartOrderItemResponse{
				DeviceID:     item.DeviceID,
				DeviceName:   item.Device.Name,
				Quantity:     item.Quantity,
				DataPerHour:  item.Device.DataPerHour,
				NamespaceURL: item.Device.NamespaceURL,
			})
		}

		response = append(response, serializers.SmartOrderToJSON(order, itemResponses))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /api/smart-orders/{id} - одна заявка
func (h *SmartOrderAPIHandler) GetSmartOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.SmartOrder
	result := h.db.Preload("Client").Preload("Moderator").First(&order, id)
	if result.Error != nil || order.Status == "deleted" {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	var items []models.OrderItem
	h.db.Preload("Device").Where("order_id = ?", order.ID).Find(&items)

	var itemResponses []serializers.SmartOrderItemResponse
	for _, item := range items {
		itemResponses = append(itemResponses, serializers.SmartOrderItemResponse{
			DeviceID:     item.DeviceID,
			DeviceName:   item.Device.Name,
			Quantity:     item.Quantity,
			DataPerHour:  item.Device.DataPerHour,
			NamespaceURL: item.Device.NamespaceURL,
		})
	}

	response := serializers.SmartOrderToJSON(order, itemResponses)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// PUT /api/smart-orders/{id}/form - формирование заявки
func (h *SmartOrderAPIHandler) FormSmartOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
	idStr = strings.TrimSuffix(idStr, "/form")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.SmartOrder
	result := h.db.First(&order, id)
	if result.Error != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	// Проверка обязательных полей
	if order.Address == "" {
		http.Error(w, "Address is required to form order", http.StatusBadRequest)
		return
	}

	// Установка статуса и даты формирования
	now := time.Now()
	order.Status = "formed"
	order.FormedAt = &now

	h.db.Save(&order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.SmartOrderToJSON(order, nil))
}

// PUT /api/smart-orders/{id}/complete - завершение заявки
func (h *SmartOrderAPIHandler) CompleteSmartOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
	idStr = strings.TrimSuffix(idStr, "/complete")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.SmartOrder
	result := h.db.First(&order, id)
	if result.Error != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	// Расчет общего трафика
	var totalTraffic float64
	h.db.Model(&models.OrderItem{}).
		Select("SUM(smart_devices.data_per_hour * order_items.quantity)").
		Joins("JOIN smart_devices ON smart_devices.id = order_items.device_id").
		Where("order_items.order_id = ?", order.ID).
		Scan(&totalTraffic)

	// Установка статуса, модератора и даты завершения
	now := time.Now()
	order.Status = "completed"
	order.CompletedAt = &now
	order.ModeratorID = uintPtr(2) // Фиксированный модератор для демо
	order.TotalTraffic = totalTraffic

	h.db.Save(&order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.SmartOrderToJSON(order, nil))
}

// Вспомогательная функция
func uintPtr(i uint) *uint {
	return &i
}
