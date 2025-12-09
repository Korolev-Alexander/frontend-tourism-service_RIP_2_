package middleware

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware логирует информацию о каждом HTTP запросе
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Вызываем следующий обработчик
		next(w, r)

		// Логируем информацию о запросе
		log.Printf(
			"%s %s %s %v",
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			time.Since(start),
		)
	}
}
