'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api/auth';
import { toast } from '@/lib/utils';
import type { AuthRequest } from '@/types/auth';
import { AxiosError } from 'axios';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, setAuth, clearAuth } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(async (credentials: AuthRequest) => {
    setIsLoggingIn(true);
    try {
      const response = await authApi.login(credentials);
      const user = response.userAuthResponse;
      setAuth(user, response.accessToken, response.refreshToken);
      
      toast.success('Добро пожаловать!', `Вы вошли как ${user.fio || user.username}`);
      
      router.push('/dashboard');
      return { success: true };
    } catch (error: unknown) {
      setIsLoggingIn(false);
      
      let message = 'Ошибка авторизации';
      if (error instanceof AxiosError) {
        message = error.response?.data.message;
      }
      
      toast.error('Ошибка входа', message);
      
      return { success: false, error: message };
    }
  }, [setAuth, router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      toast.success('До свидания!', 'Вы успешно вышли из системы');
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      router.push('/login');
    }
  }, [clearAuth, router]);

  return {
    user,
    isAuthenticated,
    isHydrated,
    isLoading: isLoggingIn,
    login,
    logout,
  };
}
