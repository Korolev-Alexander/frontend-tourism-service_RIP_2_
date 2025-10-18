package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"smartdevices/internal/api/serializers"
	"smartdevices/internal/models"

	"gorm.io/gorm"
)

type SmartDeviceAPIHandler struct {
	db *gorm.DB
}

func NewSmartDeviceAPIHandler(db *gorm.DB) *SmartDeviceAPIHandler {
	return &SmartDeviceAPIHandler{db: db}
}

// GET /api/smart-devices - список с фильтрацией
func (h *SmartDeviceAPIHandler) GetSmartDevices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	search := r.URL.Query().Get("search")
	protocol := r.URL.Query().Get("protocol")

	var devices []models.SmartDevice
	query := h.db.Where("is_active = ?", true)

	if search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?",
			"%"+search+"%", "%"+search+"%")
	}

	if protocol != "" {
		query = query.Where("protocol = ?", protocol)
	}

	result := query.Find(&devices)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	var response []serializers.SmartDeviceResponse
	for _, device := range devices {
		response = append(response, serializers.SmartDeviceToJSON(device))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /api/smart-devices/{id} - одна запись
func (h *SmartDeviceAPIHandler) GetSmartDevice(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-devices/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	var device models.SmartDevice
	result := h.db.First(&device, id)
	if result.Error != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.SmartDeviceToJSON(device))
}

// POST /api/smart-devices - добавление устройства
func (h *SmartDeviceAPIHandler) CreateSmartDevice(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req serializers.SmartDeviceCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	device := models.SmartDevice{
		Name:           req.Name,
		Model:          req.Model,
		AvgDataRate:    req.AvgDataRate,
		DataPerHour:    req.DataPerHour,
		NamespaceURL:   req.NamespaceURL,
		Description:    req.Description,
		DescriptionAll: req.DescriptionAll,
		Protocol:       req.Protocol,
		IsActive:       true,
	}

	result := h.db.Create(&device)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(serializers.SmartDeviceToJSON(device))
}

// PUT /api/smart-devices/{id} - изменение устройства
func (h *SmartDeviceAPIHandler) UpdateSmartDevice(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-devices/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	var device models.SmartDevice
	result := h.db.First(&device, id)
	if result.Error != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	var req serializers.SmartDeviceCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	device.Name = req.Name
	device.Model = req.Model
	device.AvgDataRate = req.AvgDataRate
	device.DataPerHour = req.DataPerHour
	device.NamespaceURL = req.NamespaceURL
	device.Description = req.Description
	device.DescriptionAll = req.DescriptionAll
	device.Protocol = req.Protocol

	h.db.Save(&device)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.SmartDeviceToJSON(device))
}

// DELETE /api/smart-devices/{id} - удаление устройства
func (h *SmartDeviceAPIHandler) DeleteSmartDevice(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/smart-devices/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	var device models.SmartDevice
	result := h.db.First(&device, id)
	if result.Error != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	device.IsActive = false
	h.db.Save(&device)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNoContent)
}
