export interface ProfileResponse {
  id: number;
  username: string;
  fio: string | null;
  email: string | null;
  socialNetwork: SocialNetworks;
  avatarUrl: string | null;
  roles: string[];
  department: string | null;
  position: string | null;
  isSpecialist: boolean;
  averageRating: number | null;
  ratedTicketsCount: number | null;
  createdAt: string;
}

export interface SocialNetworks {
  telegramId: number | null;
  vkId: number | null;
  maxId: number | null;
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

export interface UpdateVkRequest {
  vkId: number;
}

export interface UpdateMaxRequest {
  maxId: number;
}
