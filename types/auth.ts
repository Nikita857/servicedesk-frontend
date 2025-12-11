import { SenderType } from "./message";

export interface User {
  id: number;
  username: string;
  fio: string | null;
  telegramId: number | null;
  specialist: boolean;
  roles: string[];
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
  userAuthResponse: User;  // matches backend API field name
}

export const userRolesBadges: Record<SenderType, {name: string, color: string}> = {
    USER: {name: 'Пользователь', color: 'gray'},
    SYSADMIN: {name: 'Системный администратор', color: 'green'},
    DEV1C: {name: 'Программист 1С', color: 'blue'},
    DEVELOPER: {name: 'Разработчик', color: 'purple'},
    ADMIN: {name: 'Администратор', color: 'red'}
  };