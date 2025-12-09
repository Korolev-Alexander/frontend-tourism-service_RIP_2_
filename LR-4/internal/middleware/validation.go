package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
)

// ValidationError представляет ошибку валидации
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationMiddleware проверяет наличие обязательных полей в запросе
func ValidationMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Проверяем только POST и PUT запросы
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			next(w, r)
			return
		}

		// Проверяем только запросы к API
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next(w, r)
			return
		}

		// Декодируем тело запроса
		var body map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		// Проверяем наличие обязательных полей в зависимости от endpoint
		var errors []ValidationError

		// Для устройств проверяем title
		if strings.Contains(r.URL.Path, "/smart-devices") {
			if title, ok := body["title"].(string); !ok || title == "" {
				errors = append(errors, ValidationError{
					Field:   "title",
					Message: "Title is required",
				})
			}
		}

		// Для клиентов проверяем login и password
		if strings.Contains(r.URL.Path, "/clients") && strings.Contains(r.URL.Path, "/register") {
			if login, ok := body["login"].(string); !ok || login == "" {
				errors = append(errors, ValidationError{
					Field:   "login",
					Message: "Login is required",
				})
			}

			if password, ok := body["password"].(string); !ok || password == "" {
				errors = append(errors, ValidationError{
					Field:   "password",
					Message: "Password is required",
				})
			}
		}

		// Если есть ошибки валидации, возвращаем их
		if len(errors) > 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"errors": errors,
			})
			return
		}

		// Если ошибок нет, продолжаем обработку
		next(w, r)
	}
}
