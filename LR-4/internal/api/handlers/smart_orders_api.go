package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"smartdevices/internal/api/serializers"
	"smartdevices/internal/middleware"
	"smartdevices/internal/models"

	"gorm.io/gorm"
)

const (
	ASYNC_SERVICE_URL = "http://localhost:3000/api/traffic_calculation_async"
	SECRET_TOKEN      = "MY_SECRET_TOKEN_2025"
)

type SmartOrderAPIHandler struct {
	db             *gorm.DB
	authMiddleware *middleware.AuthMiddleware
}

func NewSmartOrderAPIHandler(db *gorm.DB) *SmartOrderAPIHandler {
	return &SmartOrderAPIHandler{
		db:             db,
		authMiddleware: middleware.NewAuthMiddleware(db),
	}
}

// GET /api/smart-orders/cart - иконка корзины
func (h *SmartOrderAPIHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

	var order models.SmartOrder
	result := h.db.Where("status = ? AND client_id = ?", "draft", currentUser.ClientID).First(&order)

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

// GET /api/smart-orders - список заявок
func (h *SmartOrderAPIHandler) GetSmartOrders(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

	status := r.URL.Query().Get("status")
	dateFromStr := r.URL.Query().Get("date_from")
	dateToStr := r.URL.Query().Get("date_to")

	var orders []models.SmartOrder
	query := h.db.Preload("Client").Preload("Moderator")

	// Если не модератор - показываем только свои заявки (включая черновики, но не удаленные)
	if !currentUser.IsModerator {
		query = query.Where("client_id = ? AND status != ?", currentUser.ClientID, "deleted")
	} else {
		// Модераторы не видят черновики и удаленные
		query = query.Where("status != ? AND status != ?", "deleted", "draft")
	}

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
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

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

	// Проверяем права доступа
	if !currentUser.IsModerator && order.ClientID != currentUser.ClientID {
		http.Error(w, "Access denied", http.StatusForbidden)
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

// PUT /api/smart-orders/{id} - изменение полей заявки
func (h *SmartOrderAPIHandler) UpdateSmartOrder(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.SmartOrder
	result := h.db.First(&order, id)
	if result.Error != nil || order.Status == "deleted" {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	// Проверяем права доступа
	if !currentUser.IsModerator && order.ClientID != currentUser.ClientID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	var req serializers.SmartOrderUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Обновляем только разрешенные поля
	if req.Address != "" {
		order.Address = req.Address
	}

	h.db.Save(&order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.SmartOrderToJSON(order, nil))
}

// PUT /api/smart-orders/{id}/form - формирование заявки
func (h *SmartOrderAPIHandler) FormSmartOrder(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

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

	// Проверяем права доступа
	if !currentUser.IsModerator && order.ClientID != currentUser.ClientID {
		http.Error(w, "Access denied", http.StatusForbidden)
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
	// Проверяем права модератора (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
	idStr = strings.TrimSuffix(idStr, "/complete")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	var order models.SmartOrder
	result := h.db.Preload("Client").First(&order, id)
	if result.Error != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	// Проверяем что заявка сформирована
	if order.Status != "formed" {
		http.Error(w, "Only formed orders can be completed", http.StatusBadRequest)
		return
	}

	// Расчет общего трафика по формуле из лабы 2
	var items []models.OrderItem
	h.db.Preload("Device").Where("order_id = ?", order.ID).Find(&items)

	totalTraffic := 0.0
	for _, item := range items {
		baseTraffic := item.Device.DataPerHour * float64(item.Quantity)

		// Формула расчета с коэффициентами для разных типов устройств
		var coefficient float64
		switch {
		case strings.Contains(item.Device.Name, "Хаб"):
			coefficient = 1.3 // Хабы требуют больше трафика
		case strings.Contains(item.Device.Name, "Датчик"):
			coefficient = 0.7 // Датчики экономят трафик
		case strings.Contains(item.Device.Name, "Лампочка"):
			coefficient = 1.1 // Лампочки немного больше
		case strings.Contains(item.Device.Name, "Розетка"):
			coefficient = 0.9 // Розетки мало трафика
		case strings.Contains(item.Device.Name, "Выключатель"):
			coefficient = 0.8 // Выключатели мало трафика
		default:
			coefficient = 1.0
		}

		traffic := baseTraffic * coefficient
		totalTraffic += traffic
	}

	// Установка статуса, модератора и даты завершения
	now := time.Now()
	order.Status = "completed"
	order.CompletedAt = &now
	order.ModeratorID = uintPtr(currentUser.ClientID)
	order.TotalTraffic = totalTraffic

	h.db.Save(&order)

	// Загружаем items для ответа
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

// DELETE /api/smart-orders/{id} - удаление заявки
func (h *SmartOrderAPIHandler) DeleteSmartOrder(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
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

	// Проверяем права доступа
	if !currentUser.IsModerator && order.ClientID != currentUser.ClientID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Мягкое удаление - меняем статус
	order.Status = "deleted"
	h.db.Save(&order)

	w.WriteHeader(http.StatusNoContent)
}

// PUT /api/traffic_result - прием результатов от асинхронного сервиса
func (h *SmartOrderAPIHandler) ReceiveTrafficResult(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token        string  `json:"token"`
		OrderID      uint    `json:"order_id"`
		TotalTraffic float64 `json:"total_traffic"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Проверка токена
	if req.Token != SECRET_TOKEN {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Обновляем заявку
	var order models.SmartOrder
	result := h.db.First(&order, req.OrderID)
	if result.Error != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	order.TotalTraffic = req.TotalTraffic
	order.TrafficCalculated = true
	h.db.Save(&order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// PUT /api/smart-orders/{id}/calculate-traffic - запуск асинхронного расчета трафика
func (h *SmartOrderAPIHandler) CalculateTrafficAsync(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя (уже проверен через middleware)
	currentUser := h.authMiddleware.GetCurrentUser(r)

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-orders/")
	idStr = strings.TrimSuffix(idStr, "/calculate-traffic")
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

	// Проверяем права доступа
	if !currentUser.IsModerator && order.ClientID != currentUser.ClientID {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	// Получаем устройства заявки
	var items []models.OrderItem
	h.db.Preload("Device").Where("order_id = ?", order.ID).Find(&items)

	// Формируем данные для асинхронного сервиса
	type DeviceItem struct {
		DeviceID    uint    `json:"device_id"`
		DeviceName  string  `json:"device_name"`
		Quantity    int     `json:"quantity"`
		DataPerHour float64 `json:"data_per_hour"`
	}

	var devices []DeviceItem
	for _, item := range items {
		devices = append(devices, DeviceItem{
			DeviceID:    item.DeviceID,
			DeviceName:  item.Device.Name,
			Quantity:    item.Quantity,
			DataPerHour: item.Device.DataPerHour,
		})
	}

	requestData := map[string]interface{}{
		"order_id": order.ID,
		"devices":  devices,
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		http.Error(w, "Failed to prepare request", http.StatusInternalServerError)
		return
	}

	// Отправляем запрос к асинхронному сервису
	resp, err := http.Post(ASYNC_SERVICE_URL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Failed to call async service: %v", err)
		http.Error(w, fmt.Sprintf("Failed to call async service: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Async service returned error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"message": "Traffic calculation started",
	})
}

// Вспомогательная функция
func uintPtr(i uint) *uint {
	return &i
}
