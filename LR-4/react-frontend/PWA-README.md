# PWA - Progressive Web Application

## Настройка проекта

Этот проект настроен как PWA (Progressive Web Application) с поддержкой HTTPS для локальной разработки.

## Что было сделано

### 1. Удалено из проекта
- ✅ Папка `src-tauri` (Tauri больше не используется в web-ветке)
- ✅ Зависимости `@tauri-apps/api` и `@tauri-apps/cli`
- ✅ Скрипт `tauri` из package.json
- ✅ Настройки GitHub Pages (закомментированная строка `base`)

### 2. Настроено PWA
- ✅ Установлен и настроен `vite-plugin-pwa`
- ✅ Добавлена регистрация Service Worker в `main.tsx`
- ✅ Настроен `manifest.json` с иконками 192x192 и 512x512
- ✅ Добавлены типы TypeScript для PWA в `tsconfig.app.json`
- ✅ Включен режим разработки для PWA (`devOptions.enabled: true`)

### 3. Настроено HTTPS
- ✅ Установлен `vite-plugin-mkcert`
- ✅ Созданы SSL сертификаты (ca.key, ca.crt, cert.key, cert.crt)
- ✅ Настроен HTTPS в `vite.config.ts`
- ✅ Сертификаты добавлены в `.gitignore` (безопасность!)

## Запуск проекта

### Первый запуск

1. Установите зависимости:
```bash
npm install
```

2. Убедитесь, что сертификаты созданы (если нет, выполните):
```bash
mkcert create-ca
mkcert create-cert
```

3. Запустите dev-сервер:
```bash
npm run dev
```

Приложение будет доступно по адресу: **https://localhost:5173** (или другой порт, указанный в консоли)

### Доступ с телефона

1. Узнайте IP-адрес вашего компьютера в локальной сети:
   - Windows: `ipconfig` (ищите IPv4 адрес, например 192.168.1.100)
   - Linux/Mac: `ip addr` или `ifconfig`

2. Убедитесь, что компьютер и телефон в одной сети Wi-Fi

3. Откройте на телефоне: **https://[ваш-IP]:5173** (например, https://192.168.1.100:5173)

4. Браузер покажет предупреждение о сертификате - это нормально для локальной разработки. Нажмите "Продолжить" или "Принять риск"

5. После загрузки приложения, в меню браузера появится опция **"Добавить на главный экран"** или **"Установить приложение"**

## Проверка PWA

### В браузере (Chrome/Edge)

1. Откройте DevTools (F12)
2. Перейдите на вкладку **Application**
3. Проверьте:
   - **Manifest**: должен отображаться без ошибок
   - **Service Workers**: должен быть активен
   - **Storage**: проверьте кеш

### Тестирование offline-режима

1. Откройте приложение
2. В DevTools → Application → Service Workers отметьте "Offline"
3. Перезагрузите страницу - приложение должно работать!

## Структура PWA

```
LR-4/react-frontend/
├── public/
│   ├── manifest.json          # Манифест PWA
│   ├── icon-192x192.png       # Иконка 192x192
│   └── icon-512x512.png       # Иконка 512x512
├── src/
│   └── main.tsx               # Регистрация Service Worker
├── vite.config.ts             # Настройка PWA и HTTPS
├── tsconfig.app.json          # Типы для PWA
├── cert.key                   # SSL приватный ключ (в .gitignore)
├── cert.crt                   # SSL сертификат (в .gitignore)
├── ca.key                     # CA приватный ключ (в .gitignore)
└── ca.crt                     # CA сертификат (в .gitignore)
```

## Важные замечания

⚠️ **Безопасность**: Файлы `*.key` и `*.crt` добавлены в `.gitignore` и НЕ должны попадать в репозиторий!

⚠️ **HTTPS обязателен**: PWA требует HTTPS для работы Service Worker (кроме localhost)

⚠️ **Сертификаты**: Созданные сертификаты действительны только для локальной разработки

## Возможные проблемы

### Service Worker не регистрируется
- Проверьте, что используется HTTPS (не HTTP)
- Очистите кеш браузера
- Проверьте консоль на ошибки

### Не появляется кнопка "Установить"
- Убедитесь, что manifest.json корректен
- Проверьте наличие иконок
- Убедитесь, что Service Worker активен

### Ошибка сертификата на телефоне
- Это нормально для самоподписанных сертификатов
- Нажмите "Продолжить" или "Принять риск"
- Для production используйте настоящие SSL сертификаты

## Дополнительная информация

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
