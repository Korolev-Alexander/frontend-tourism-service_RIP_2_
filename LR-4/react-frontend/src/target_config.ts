// Конфигурация API endpoints
// Использует переменные окружения для dev режима, абсолютные URL для production

export const BASE_API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.12:8082/api";
export const BASE_IMG_URL = import.meta.env.VITE_IMG_URL || "http://192.168.1.12:9000";

// Логирование для отладки
console.log('🌐 API URL:', BASE_API_URL);
console.log('🖼️ IMG URL:', BASE_IMG_URL);
console.log('🔧 Mode:', import.meta.env.MODE);
