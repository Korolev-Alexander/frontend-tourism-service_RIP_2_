// Конфигурация для Tauri приложения
// Автоматическое определение режима и переключение между proxy и прямыми запросами

// Определяем, запущено ли приложение в Tauri
// Используем переменную окружения TAURI_ENV_PLATFORM, которая доступна только в Tauri
const isTauriEnv = import.meta.env.TAURI_ENV_PLATFORM !== undefined;

// Дополнительная проверка через window.__TAURI__ (для runtime)
const isTauriWindow = typeof window !== 'undefined' && '__TAURI__' in window;

// Комбинированная проверка
const target_tauri = isTauriEnv || isTauriWindow;

// IP адрес сервера в локальной сети (получен через ipconfig)
export const api_proxy_addr = "http://192.168.1.12:8082/api"
export const img_proxy_addr = "http://192.168.1.12:9000"

// Переключение между режимами:
// - Tauri (build/dev): используем прямые IP адреса для обхода CORS
// - Browser dev: используем proxy через Vite (/api, /img-proxy)
export const dest_api = target_tauri ? api_proxy_addr : "/api"
export const dest_img = target_tauri ? img_proxy_addr : "/img-proxy"

// Для совместимости с существующим кодом
export const BASE_API_URL = dest_api;
export const BASE_IMG_URL = dest_img;

// Логирование для отладки
console.log('🔧 Tauri Mode:', target_tauri);
console.log('🔧 Tauri Env:', isTauriEnv);
console.log('🔧 Tauri Window:', isTauriWindow);
console.log('🌐 API URL:', dest_api);
console.log('🖼️ IMG URL:', dest_img);
console.log('📍 Environment:', import.meta.env.MODE);
