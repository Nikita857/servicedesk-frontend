export interface ProfileResponse {
  id: number;
  username: string;
  fio: string | null;
  email: string | null;
  socialNetwork: SocialNetworks;
  avatarUrl: string | null;
  roles: string[];
  specialistType?: string | null;
  department: string | null;
  position: string | null;
  isSpecialist: boolean;
  averageRating: number | null;
  ratedTicketsCount: number | null;
  createdAt: string;
}

export interface SocialNetworks {
  bitrixUserId: number | null;
  vkId: number | null;
  maxId: number | null;
}

export type { UpdateProfileRequest, ChangePasswordRequest, UpdateBitrixRequest, UpdateVkRequest, UpdateMaxRequest } from '@/lib/api/generated/models';
