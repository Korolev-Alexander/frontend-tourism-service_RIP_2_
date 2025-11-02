package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// GetUsersInfo возвращает информацию о пользователях через Lua скрипт
func (a *AuthMiddleware) GetUsersInfo(w http.ResponseWriter, r *http.Request) {
	usersInfo, err := a.sessionManager.GetUsersInfo()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed to get users info: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    usersInfo,
	})
}

// GetSessionStats возвращает статистику по сессиям через Lua
func (a *AuthMiddleware) GetSessionStats(w http.ResponseWriter, r *http.Request) {
	stats, err := a.sessionManager.GetSessionStats()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "Failed to get session stats: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"stats":   stats,
	})
}
