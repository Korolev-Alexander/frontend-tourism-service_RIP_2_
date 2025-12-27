package middleware

import "net/http"

// CORSMiddleware обрабатывает CORS заголовки для поддержки Tauri приложения и локальной разработки
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Разрешаем запросы от Tauri (tauri://localhost) и локальной сети
		allowedOrigins := []string{
			"tauri://localhost",
			"http://localhost:5173",
			"http://192.168.1.12:5173",
			"http://127.0.0.1:5173",
		}

		// Проверяем, разрешён ли origin
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				isAllowed = true
				break
			}
		}

		// Устанавливаем CORS заголовки
		if isAllowed && origin != "" {
			// Для известных origins используем конкретный origin
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		} else {
			// Для всех остальных (включая Tauri fetch без Origin) разрешаем все
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, Authorization, Cookie")
		w.Header().Set("Access-Control-Max-Age", "3600")

		// Обработка preflight запросов
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
