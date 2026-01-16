import { SenderType } from "./message";

export interface User {
  id: number;
  username: string;
  fio: string | null;
  telegramId: number | null;
  avatarUrl: string | null;
  specialist: boolean;
  roles: string[];
  department: string | null;
  position: string | null;
  active: boolean;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userAuthResponse: User; // matches backend API field name
}

export const userRolesBadges: Record<
  SenderType,
  { name: string; color: string; description: string }
> = {
  USER: {
    name: "Пользователь",
    color: "gray",
    description: "Может создавать заявки и общаться со специалистами",
  },
  SYSADMIN: {
    name: "Системный администратор",
    color: "green",
    description:
      "Специалист 1-й линии поддержки. Решает базовые технические вопросы",
  },
  "1CSUPPORT": {
    name: "1С Поддержка",
    color: "blue",
    description: "Специалист по поддержке продуктов 1С",
  },
  DEV1C: {
    name: "Программист 1С",
    color: "blue",
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
