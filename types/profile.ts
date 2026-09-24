import type { ProfileResponse as WireProfileResponse, SocialNetworks as WireSocialNetworks } from '@/lib/api/generated/models';

export type ProfileResponse = Pick<Required<WireProfileResponse>, 'id' | 'username' | 'roles' | 'isSpecialist' | 'createdAt'> & {
  fio: string | null;
  email: string | null;
  socialNetwork: SocialNetworks;
  avatarUrl: string | null;
  specialistType?: string | null;
  department: string | null;
  position: string | null;
  averageRating: number | null;
  ratedTicketsCount: number | null;
};

export type SocialNetworks = { [K in keyof WireSocialNetworks]-?: NonNullable<WireSocialNetworks[K]> | null };

export type { UpdateProfileRequest, ChangePasswordRequest, UpdateBitrixRequest, UpdateVkRequest, UpdateMaxRequest } from '@/lib/api/generated/models';
