/**
 * Вариант 1: Петров В. В.
 * Берет фамилию целиком и первые буквы имени и отчества
 */
export function getFullNameInitials(fio: string | null | undefined): string {
  if (fio === null || fio === undefined) return "";
  const parts = fio.trim().split(/\s+/); // Разбиваем по пробелам
  if (parts.length < 2) return parts[0]; // Если только одно слово

  const lastName = parts[0];
  const rest = parts.slice(1).map((name) => `${name[0].toUpperCase()}.`);

  return `${lastName} ${rest.join(" ")}`;
}

/**
 * Вариант 2: В. В.
 * Берет только инициалы (первые буквы всех слов)
 */
export function getShortInitials(fio: string | null | undefined): string {
  if (fio === null || fio === undefined) return "";
  const parts = fio.trim().split(/\s+/);
  // Если частей меньше 2, возвращаем только первую букву (на случай, если указано только имя)
  if (parts.length < 2) return `${parts[0][0].toUpperCase()}.`;

  // Берем все части, кроме первой (фамилии),
  // берем первую букву, добавляем точку и соединяем
  return parts
    .slice(1) // Пропускаем фамилию
    .map((name) => `${name[0].toUpperCase()}.`)
    .join("");
}
