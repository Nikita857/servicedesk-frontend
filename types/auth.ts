import type { ActivityStatus } from "./support-line";

export type UserActivityStatus = ActivityStatus;

export interface UserStatusResponse {
  status: UserActivityStatus;
  availableForAssignment: boolean;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  fio: string | null;
  telegramId: number | null;
  avatarUrl: string | null;
  specialist: boolean;
  roles: string[];
  departmentName: string | null;
  positionName: string | null;
  active: boolean;
}

export type SenderType =
  | "USER"
  | "SYSADMIN"
  | "ONE_C_SUPPORT"
  | "DEV1C"
  | "DEVELOPER"
  | "ADMIN";

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  userAuthResponse: User; // matches backend API field name
}

export const userRolesBadges: Record<
  string,
  { name: string; color: string; description: string }
> = {
  USER: {
    name: "Пользователь",
    color: "gray",
    description: "Может создавать заявки и общаться со специалистами",
  },
  SYSADMIN: {
    name: "Сисадмин",
    color: "green",
    description:
      "Специалист 1-й линии поддержки. Решает базовые технические вопросы",
  },
  ONE_C_SUPPORT: {
    name: "1С Поддержка",
    color: "blue",
    description: "Специалист по поддержке продуктов 1С",
  },
  DEV1C: {
    name: "Разработчик 1С",
    color: "orange",
    description: "Разработчик 1С. Решает сложные задачи по 1С",
  },
  DEVELOPER: {
    name: "Разработчик",
    color: "purple",
    description: "Разработчик ПО. Решает задачи по разработке и интеграции",
  },
  ADMIN: {
    name: "Администратор",
    color: "red",
    description:
      "Полный доступ к системе. Управление пользователями и настройками",
  },
};

// Activity Status labels and colors
export const activityStatusConfig: Record<
  string,
  { label: string; color: string; description: string }
> = {
  AVAILABLE: {
    label: "Доступен",
    color: "green",
    description: "Готов принимать новые заявки",
  },
  UNAVAILABLE: {
    label: "Недоступен",
    color: "gray",
    description: "Временно отсутствует на месте",
  },
  BUSY: {
    label: "Занят",
    color: "red",
    description: "Выполняет сложную задачу или на встрече",
  },
  TECHNICAL_ISSUE: {
    label: "Техн. проблемы",
    color: "orange",
    description: "Проблемы с интернетом или оборудованием",
  },
  OFFLINE: {
    label: "Оффлайн",
    color: "gray",
    description: "Не на работе",
  },
};
