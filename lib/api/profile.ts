import type { ChangePasswordRequest, ProfileResponse, UpdateProfileRequest, UpdateBitrixRequest, UpdateVkRequest, UpdateMaxRequest } from '@/types/profile';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => (await generated.getProfile()).data as ProfileResponse,
  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => (await generated.updateProfile(data)).data as ProfileResponse,
  changePassword: async (data: ChangePasswordRequest): Promise<void> => { await generated.changePassword(data); },
  updateBitrix: async (data: UpdateBitrixRequest): Promise<void> => { await generated.updateBitrixUserId(data); },
  updateVk: async (data: UpdateVkRequest): Promise<void> => { await generated.updateVkId(data); },
  updateMax: async (data: UpdateMaxRequest): Promise<void> => { await generated.updateMaxId(data); },
  uploadAvatar: async (file: File): Promise<string> => (await generated.uploadAvatar({ file })).data as string,
  deleteAvatar: async (): Promise<void> => { await generated.deleteAvatar(); },
};

export type { ProfileResponse, UpdateProfileRequest };
