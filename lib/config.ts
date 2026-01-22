// Централизованная конфигурация API
// Все API маршруты должны использовать эти константы

// Базовый URL сервера (без /api/v1)
export const API_SERVER_URL = "http://192.168.14.9:8080";

// Базовый URL API (с /api/v1)
export const API_BASE_URL = `${API_SERVER_URL}/api/v1`;

// URL для WebSocket соединения
export const WS_URL = `${API_SERVER_URL}/ws`;

// Функция для построения полного URL файла/аттачмента
export function getFileUrl(path: string): string {
  if (!path) return "";

  // Если путь уже абсолютный, возвращаем как есть
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Если путь начинается с /api, добавляем только сервер
  if (path.startsWith("/api")) {
    return `${API_SERVER_URL}${path}`;
  }

  // Иначе добавляем полный базовый URL
  return `${API_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
}
