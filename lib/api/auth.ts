import type { AuthRequest, AuthResponse, User } from '@/types/auth';
import { getServiceDeskAPI } from './generated/client';
import { toUserView } from './userAuthView';

const generated = getServiceDeskAPI();

export const authApi = {
  login: async (credentials: AuthRequest): Promise<Omit<AuthResponse, 'userAuthResponse' | 'expiresIn'> & { userAuthResponse: User; expiresIn: number }> => {
    const data = (await generated.login(credentials)).data;
    if (!data?.userAuthResponse || data.expiresIn == null) {
      throw new Error('Authentication response is missing user data');
    }
    return { ...data, userAuthResponse: toUserView(data.userAuthResponse), expiresIn: data.expiresIn };
  },
  logout: async (): Promise<void> => { await generated.logout(); },
};
