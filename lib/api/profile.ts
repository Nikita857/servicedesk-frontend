import type { ChangePasswordRequest, ProfileResponse, UpdateProfileRequest, UpdateBitrixRequest, UpdateVkRequest, UpdateMaxRequest } from '@/types/profile';
import { getServiceDeskAPI } from './generated/client';
import type { ProfileResponse as WireProfileResponse } from './generated/models';
import { requireData } from './ticketContractView';

const generated = getServiceDeskAPI();

function toProfileView(wire: WireProfileResponse): ProfileResponse {
  if (wire.id == null || wire.username == null || wire.roles == null ||
      wire.isSpecialist == null || wire.createdAt == null || wire.socialNetwork == null) {
    throw new Error('Profile response is missing required data');
  }
  return {
    id: wire.id,
    username: wire.username,
    fio: wire.fio ?? null,
    email: wire.email ?? null,
    socialNetwork: {
      bitrixUserId: wire.socialNetwork.bitrixUserId ?? null,
      vkId: wire.socialNetwork.vkId ?? null,
      maxId: wire.socialNetwork.maxId ?? null,
    },
    avatarUrl: wire.avatarUrl ?? null,
    roles: wire.roles,
    specialistType: wire.specialistType ?? null,
    department: wire.department ?? null,
    position: wire.position ?? null,
    isSpecialist: wire.isSpecialist,
    averageRating: wire.averageRating ?? null,
    ratedTicketsCount: wire.ratedTicketsCount ?? null,
    createdAt: wire.createdAt,
  };
}

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => toProfileView(requireData(await generated.getProfile())),
  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => toProfileView(requireData(await generated.updateProfile(data))),
  changePassword: async (data: ChangePasswordRequest): Promise<void> => { await generated.changePassword(data); },
  updateBitrix: async (data: UpdateBitrixRequest): Promise<void> => { await generated.updateBitrixUserId(data); },
  updateVk: async (data: UpdateVkRequest): Promise<void> => { await generated.updateVkId(data); },
  updateMax: async (data: UpdateMaxRequest): Promise<void> => { await generated.updateMaxId(data); },
  uploadAvatar: async (file: File): Promise<string> => requireData(await generated.uploadAvatar({ file })),
  deleteAvatar: async (): Promise<void> => { await generated.deleteAvatar(); },
};

export type { ProfileResponse, UpdateProfileRequest };
