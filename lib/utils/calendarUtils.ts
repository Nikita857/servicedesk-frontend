import { DateWindow, ScheduledTaskOccurrenceResponse } from "@/types/scheduler";
import { TicketPriority } from "@/types/ticket";

export function getMonthWindow(month: Date): DateWindow {
  const year = month.getFullYear();
  const m = month.getMonth();

  // 1. Первый день текущего месяца
  const firstDay = new Date(year, m, 1);
  // 2. Последний день текущего месяца
  const lastDay = new Date(year, m + 1, 0);

  // --- Логика смещений ---
  // getDay(): 0 (вс) ... 6 (сб)
  // Нам нужно: пн=0, вт=1 ... вс=6
  // (day + 6) % 7 превращает вс из 0 в 6, а пн из 1 в 0
  const startOffset = (firstDay.getDay() + 6) % 7;

  // (7 - day) % 7 превращает вс из 0 в 0, а сб из 6 в 1
  const endOffset = (7 - lastDay.getDay()) % 7;

  // --- Вычисляем границы ---
  const from = new Date(year, m, 1 - startOffset);
  from.setHours(0, 0, 0, 0);

  const to = new Date(year, m + 1, 0 + endOffset);
  to.setHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

export function buildMonthMatrix(month: Date): Date[][] {
  const matrix: Date[][] = [];

  // 1. Получаем начальную точку (понедельник первой недели месяца)
  // Используем логику из getMonthWindow для вычисления 'from'
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDayOfMonth = new Date(year, m, 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

  // Начальная дата (первая ячейка сетки)
  const currentDate = new Date(year, m, 1 - startOffset);

  // 2. Заполняем 6 строк по 7 дней
  for (let row = 0; row < 6; row++) {
    const week: Date[] = [];
    for (let col = 0; col < 7; col++) {
      // Клонируем дату, чтобы не менять оригинальный объект
      week.push(new Date(currentDate));

      // Переходим к следующему дню
      currentDate.setDate(currentDate.getDate() + 1);
    }
    matrix.push(week);
  }

  return matrix;
}

/**
 * Возвращает строку в формате YYYY-MM-DD для локального времени.
 */
export function formatLocalDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function groupByLocalDay(
  items: ScheduledTaskOccurrenceResponse[],
): Map<string, ScheduledTaskOccurrenceResponse[]> {
  const map = new Map<string, ScheduledTaskOccurrenceResponse[]>();

  // 1. Группировка
  for (const item of items) {
    const date = new Date(item.occurrenceAt);
    const key = formatLocalDayKey(date);

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  }

  // 2. Сортировка внутри каждой группы
  for (const tasks of map.values()) {
    tasks.sort((a, b) => a.occurrenceAt.localeCompare(b.occurrenceAt));
  }

  return map;
}

export function priorityColor(priority: TicketPriority): {
  bg: string;
  fg: string;
} {
  switch (priority) {
    case "LOW":
      return { bg: "gray.100", fg: "gray.600" };
    case "MEDIUM":
      return { bg: "blue.100", fg: "blue.700" };
    case "HIGH":
      return { bg: "orange.100", fg: "orange.700" };
    case "URGENT":
      return { bg: "red.100", fg: "red.700" };
    default:
      // Возврат дефолтных значений для безопасности
      return { bg: "gray.100", fg: "gray.600" };
  }
}
