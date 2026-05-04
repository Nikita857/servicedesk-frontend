/**
 * Централизованные утилиты для форматирования данных
 * Используются в компонентах вместо локальных функций
 */

/**
 * Форматирование даты в русской локали
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Преобразует ISO-строку в формат HH:mm в локальном времени пользователя.
 */
export function formatTime(iso: string): string {
  const date = new Date(iso);

  // Вариант 1: Через toLocaleTimeString (чище)
  return date.toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Форматирование размера файла в читаемый формат
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

/**
 * Форматирование длительности в часах и минутах
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}ч ${minutes}м`;
}

/**
 * Форматирование длительности в полном формате
 */
export function formatDurationFull(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const remainingSecondsAfterDays = seconds % (24 * 3600);
  const hours = Math.floor(remainingSecondsAfterDays / 3600);
  const minutes = Math.floor((remainingSecondsAfterDays % 3600) / 60);
  const secs = Math.floor(remainingSecondsAfterDays % 60);

  if (days > 0) {
    return `${days} д ${hours} ч`;
  }
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  if (minutes > 0) {
    return `${minutes} мин ${secs} сек`;
  }
  return `${secs} сек`;
}
