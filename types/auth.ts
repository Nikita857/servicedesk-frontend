export interface User {
  id: number;
  username: string;
  fio: string | null;
  email: string | null;
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
  user: User;
}
