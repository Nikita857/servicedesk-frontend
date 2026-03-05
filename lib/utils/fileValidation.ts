/**
 * Утилиты для валидации файлов
 * Используются при загрузке вложений в чате и тикетах
 */

/**
 * Заблокированные расширения файлов (исполняемые)
 */
const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.msi',
  '.dll',
  '.scr',
  '.vbs',
  '.com',
  '.pif',
] as const;

/**
 * Максимальный размер файла в байтах (10 MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Максимальный размер файла в человекочитаемом формате
 */
const MAX_FILE_SIZE_LABEL = '200 MB';

/**
 * Проверка, является ли файл изображением
 */
export function isImageType(mimeType: string): boolean {
  return mimeType?.startsWith('image/');
}

/**
 * Валидация файла перед загрузкой
 * @returns Сообщение об ошибке или null если файл валиден
 */
export function validateFile(file: File): string | null {
  // Проверка размера
  if (file.size > MAX_FILE_SIZE) {
    return `Файл слишком большой (макс. ${MAX_FILE_SIZE_LABEL})`;
  }

  // Проверка расширения
  const fileName = file.name.toLowerCase();
  for (const ext of BLOCKED_EXTENSIONS) {
    if (fileName.endsWith(ext)) {
      return `Тип файла не разрешён: ${ext}`;
    }
  }

  return null;
}

