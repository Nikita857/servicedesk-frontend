export interface ProfileResponse {
  id: number;
  username: string;
  fio: string | null;
  email: string | null;
  telegramId: number | null;
  avatarUrl: string | null;
  roles: string[];
  department: string | null;
  position: string | null;
  isSpecialist: boolean;
  averageRating: number | null;
  ratedTicketsCount: number | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fio?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateTelegramRequest {
  telegramId: number;
}
