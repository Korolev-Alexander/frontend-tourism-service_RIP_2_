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

type ClientAPIHandler struct {
	db *gorm.DB
}

func NewClientAPIHandler(db *gorm.DB) *ClientAPIHandler {
	return &ClientAPIHandler{db: db}
}

// GET /api/clients - список клиентов
func (h *ClientAPIHandler) GetClients(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var clients []models.Client
	result := h.db.Find(&clients)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	var response []serializers.ClientResponse
	for _, client := range clients {
		response = append(response, serializers.ClientToJSON(client))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /api/clients/{id} - один клиент
func (h *ClientAPIHandler) GetClient(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/clients/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	var client models.Client
	result := h.db.First(&client, id)
	if result.Error != nil {
		http.Error(w, "Client not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.ClientToJSON(client))
}

// POST /api/clients - создание клиента
func (h *ClientAPIHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req serializers.ClientRegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	client := models.Client{
		Username: req.Username,
		Password: req.Password,
		IsActive: true,
	}

	result := h.db.Create(&client)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(serializers.ClientToJSON(client))
}

// PUT /api/clients/{id} - изменение клиента
func (h *ClientAPIHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/clients/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	var client models.Client
	result := h.db.First(&client, id)
	if result.Error != nil {
		http.Error(w, "Client not found", http.StatusNotFound)
		return
	}

	var req serializers.ClientRegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	client.Username = req.Username
	if req.Password != "" {
		client.Password = req.Password
	}

	h.db.Save(&client)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.ClientToJSON(client))
}
