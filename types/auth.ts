import { SocialNetworks } from "./profile";
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
  socialNetworks: SocialNetworks;
  avatarUrl: string | null;
  specialist: boolean;
  roles: string[];
  permissions: string[];
  specialistType?: string | null;
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
  | "SUPERVISOR"
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
  SPECIALIST: {
    name: "Специалист",
    color: "green",
    description:
      "Обрабатывает заявки. Тип специалиста определяет линию поддержки",
  },
  SUPERVISOR: {
    name: "Супервизор",
    color: "teal",
    description:
      "Полный доступ к тикетам всех линий: просмотр, назначение, переадресация, статистика",
  },
  ADMIN: {
    name: "Администратор",
    color: "red",
    description:
      "Полный доступ к системе. Управление пользователями и настройками",
  },
};

// Конфиг для отображения SpecialistType по коду (без запроса к API)
export const specialistTypeDisplayConfig: Record<
  string,
  { name: string; color: string }
> = {
  SYSADMIN: { name: "Сисадмин", color: "green" },
  ONE_C_SUPPORT: { name: "1С Поддержка", color: "blue" },
  DEV1C: { name: "Разработчик 1С", color: "orange" },
  DEVELOPER: { name: "Разработчик", color: "purple" },
};

export function getSpecialistTypeInfo(code: string | null | undefined): {
  name: string;
  color: string;
} {
  if (!code) return { name: "—", color: "gray" };
  return specialistTypeDisplayConfig[code] ?? { name: code, color: "gray" };
}

// Activity Status labels and colors
export const activityStatusConfig: Record<
  string,
  { label: string; color: string }
> = {
  AVAILABLE: {
    label: "Доступен",
    color: "green",
  },
  UNAVAILABLE: {
    label: "Недоступен",
    color: "gray",
  },
  BUSY: {
    label: "Занят",
    color: "red",
  },
  TECHNICAL_ISSUE: {
    label: "Техн. проблемы",
    color: "orange",
  },
  OFFLINE: {
    label: "Оффлайн",
    color: "gray",
  },
};
