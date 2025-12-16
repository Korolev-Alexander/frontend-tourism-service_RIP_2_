package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"smartdevices/internal/models"
	"smartdevices/internal/session"

	"golang.org/x/net/context"
	"gorm.io/gorm"
)

type AuthMiddleware struct {
	db             *gorm.DB
	sessionManager *session.Manager
}

func NewAuthMiddleware(db *gorm.DB) *AuthMiddleware {
	return &AuthMiddleware{
		db:             db,
		sessionManager: session.NewSessionManager(),
	}
}

// GetSession извлекает сессию из куки
func (a *AuthMiddleware) GetSession(r *http.Request) (*session.Session, error) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		return nil, err
	}

	return a.sessionManager.GetSession(cookie.Value)
}

// CreateSession создает новую сессию
func (a *AuthMiddleware) CreateSession(client models.Client) (string, error) {
	sessionID := fmt.Sprintf("%d-%d", client.ID, time.Now().Unix())
	session := session.Session{
		ClientID:    client.ID,
		Username:    client.Username,
		IsModerator: client.IsModerator,
	}

	err := a.sessionManager.CreateSession(sessionID, session, 24*time.Hour)
	if err != nil {
		return "", err
	}

	return sessionID, nil
}

// DeleteSession удаляет сессию
func (a *AuthMiddleware) DeleteSession(sessionID string) error {
	return a.sessionManager.DeleteSession(sessionID)
}

// GetCurrentUser возвращает текущего пользователя из контекста
func (a *AuthMiddleware) GetCurrentUser(r *http.Request) *session.Session {
	user, ok := r.Context().Value("user").(*session.Session)
	if !ok {
		return nil
	}
	return user
}

// RequireAuth middleware проверяет аутентификацию
func (a *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, err := a.GetSession(r)
		if err != nil {
			http.Error(w, `{"error": "Authentication required"}`, http.StatusUnauthorized)
			return
		}

		// Добавляем информацию о пользователе в контекст
		ctx := context.WithValue(r.Context(), "user", session)
		next(w, r.WithContext(ctx))
	}
}

// RequireModerator middleware проверяет права модератора
func (a *AuthMiddleware) RequireModerator(next http.HandlerFunc) http.HandlerFunc {
	return a.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		user := a.GetCurrentUser(r)
		if user == nil || !user.IsModerator {
			http.Error(w, `{"error": "Moderator access required"}`, http.StatusForbidden)
			return
		}
		next(w, r)
	})
}

// Login обрабатывает аутентификацию
func (a *AuthMiddleware) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ищем пользователя в БД
	var client models.Client
	result := a.db.Where("username = ? AND password = ? AND is_active = ?",
		req.Username, req.Password, true).First(&client)

	if result.Error != nil {
		http.Error(w, `{"error": "Invalid credentials"}`, http.StatusUnauthorized)
		return
	}

	// Создаем сессию
	sessionID, err := a.CreateSession(client)
	if err != nil {
		http.Error(w, `{"error": "Session creation failed"}`, http.StatusInternalServerError)
		return
	}

	// Устанавливаем куки
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   86400, // 24 часа
		HttpOnly: true,
		Secure:   false,                // true в production
		SameSite: http.SameSiteLaxMode, // Для localhost без HTTPS
	})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user": map[string]interface{}{
			"id":           client.ID,
			"username":     client.Username,
			"is_moderator": client.IsModerator,
		},
		"message": "Login successful",
	})
}

// Logout обрабатывает выход
func (a *AuthMiddleware) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err == nil {
		a.sessionManager.DeleteSession(cookie.Value)
	}

	// Очищаем куки
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode, // Для localhost без HTTPS
	})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Logout successful",
	})
}

// GetSessionInfo возвращает информацию о текущей сессии
func (a *AuthMiddleware) GetSessionInfo(w http.ResponseWriter, r *http.Request) {
	session, err := a.GetSession(r)
	if err != nil {
		http.Error(w, `{"error": "Not authenticated"}`, http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"user": map[string]interface{}{
			"id":           session.ClientID,
			"client_id":    session.ClientID,
			"username":     session.Username,
			"is_moderator": session.IsModerator,
		},
	})
}

// GetAllSessions возвращает все активные сессии (для админов)
func (a *AuthMiddleware) GetAllSessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := a.sessionManager.GetAllSessions()
	if err != nil {
		http.Error(w, `{"error": "Failed to get sessions"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"sessions": sessions,
	})
}
