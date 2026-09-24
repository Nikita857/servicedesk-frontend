/** UI presentation for activity statuses. WebSocket payloads live in generated models. */
import type { UserActivityStatus } from "./auth";
export type { UserActivityStatus } from "./auth";

interface StatusOption {
  label: string;
  color: string;
}

export const statusConfig: Record<UserActivityStatus, StatusOption> = {
  AVAILABLE: { label: "Онлайн", color: "green.400" },
  BUSY: { label: "Занят", color: "red.400" },
  UNAVAILABLE: { label: "Недоступен", color: "orange.400" },
  OFFLINE: { label: "Не в сети", color: "gray.400" },
  TECHNICAL_ISSUE: { label: "Техн. Проблемы", color: "orange.400" },
};
