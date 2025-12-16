package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"smartdevices/internal/api/serializers"
	"smartdevices/internal/middleware"
	"smartdevices/internal/models"

	"gorm.io/gorm"
)

type ClientAPIHandler struct {
	db             *gorm.DB
	authMiddleware *middleware.AuthMiddleware
}

func NewClientAPIHandler(db *gorm.DB) *ClientAPIHandler {
	return &ClientAPIHandler{
		db:             db,
		authMiddleware: middleware.NewAuthMiddleware(db),
	}
}

// GET /api/clients - список клиентов
func (h *ClientAPIHandler) GetClients(w http.ResponseWriter, r *http.Request) {
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

// POST /api/clients/register - создание клиента
func (h *ClientAPIHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
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

// PUT /api/clients/update - изменение клиента
func (h *ClientAPIHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	// Получаем текущего пользователя
	currentUser := h.authMiddleware.GetCurrentUser(r)
	if currentUser == nil {
		http.Error(w, `{"error": "Authentication required"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		ID              uint   `json:"id"`
		Username        string `json:"username"`
		Password        string `json:"password"`
		CurrentPassword string `json:"current_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ
	log.Printf("🔍 UpdateClient DEBUG:")
	log.Printf("   currentUser.ClientID = %d (type: %T)", currentUser.ClientID, currentUser.ClientID)
	log.Printf("   req.ID = %d (type: %T)", req.ID, req.ID)
	log.Printf("   currentUser.IsModerator = %v", currentUser.IsModerator)
	log.Printf("   Comparison result: %v", currentUser.ClientID != req.ID)

	// Проверяем что пользователь обновляет свои данные
	if currentUser.ClientID != req.ID && !currentUser.IsModerator {
		log.Printf("❌ Access denied: ClientID mismatch")
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	var client models.Client
	result := h.db.First(&client, req.ID)
	if result.Error != nil {
		http.Error(w, "Client not found", http.StatusNotFound)
		return
	}

	// Проверяем текущий пароль перед изменением данных
	if req.CurrentPassword != "" {
		if client.Password != req.CurrentPassword {
			http.Error(w, "Invalid current password", http.StatusUnauthorized)
			return
		}
	} else if req.Password != "" {
		// Если пытаются изменить пароль без указания текущего
		http.Error(w, "Current password required to change password", http.StatusBadRequest)
		return
	}

	// Обновляем данные
	client.Username = req.Username
	if req.Password != "" {
		client.Password = req.Password
	}

	h.db.Save(&client)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serializers.ClientToJSON(client))
}

// POST /api/clients/login - аутентификация
func (h *ClientAPIHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req serializers.ClientLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var client models.Client
	result := h.db.Where("username = ? AND password = ? AND is_active = ?", req.Username, req.Password, true).First(&client)
	if result.Error != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Создаем сессию через middleware
	sessionID, err := h.authMiddleware.CreateSession(client)
	if err != nil {
		http.Error(w, "Session creation failed", http.StatusInternalServerError)
		return
	}

	// Устанавливаем куки
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   86400, // 24 часа
		HttpOnly: true,
		Secure:   false, // true в production
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user":    serializers.ClientToJSON(client),
		"message": "Login successful",
	})
}

// POST /api/clients/logout - деавторизация
func (h *ClientAPIHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err == nil {
		h.authMiddleware.DeleteSession(cookie.Value)
	}

	// Очищаем куки
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Logout successful",
	})
}
