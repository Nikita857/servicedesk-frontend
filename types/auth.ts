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
