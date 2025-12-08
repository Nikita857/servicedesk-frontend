import { AuthRequest, AuthResponse, User } from '@/types/auth';
import api from './client';

export const authApi = {
  login: async (credentials: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post<{ data: AuthResponse }>('/auth/login', credentials);
    return response.data.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ data: User }>('/users/me');
    return response.data.data;
  },
};
