import api from "./client";
import type {
  ChangePasswordRequest,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateTelegramRequest,
  UpdateVkRequest,
  UpdateMaxRequest,
} from "@/types/profile";

// ==================== API ====================

export const profileApi = {
  /**
   * Получить профиль текущего пользователя
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<{ data: ProfileResponse }>("/profile");
    return response.data.data;
  },

  /**
   * Обновить профиль (ФИО, email)
   */
  updateProfile: async (
    data: UpdateProfileRequest
  ): Promise<ProfileResponse> => {
    const response = await api.patch<{ data: ProfileResponse }>(
      "/profile",
      data
    );
    return response.data.data;
  },

  /**
   * Сменить пароль
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put("/profile/password", data);
  },

  /**
   * Привязать Telegram
   */
  updateTelegram: async (data: UpdateTelegramRequest): Promise<void> => {
    await api.put("/profile/telegram", data);
  },

  /**
   * Привязать ВКонтакте
   */
  updateVk: async (data: UpdateVkRequest): Promise<void> => {
    await api.put("/profile/vk", data);
  },

  /**
   * Привязать MAX
   */
  updateMax: async (data: UpdateMaxRequest): Promise<void> => {
    await api.put("/profile/max", data);
  },

  /**
   * Загрузить аватар
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ data: string }>(
      "/profile/avatar",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.data;
  },

  /**
   * Удалить аватар
   */
  deleteAvatar: async (): Promise<void> => {
    await api.delete("/profile/avatar");
  },
};

export type { ProfileResponse, UpdateProfileRequest };
