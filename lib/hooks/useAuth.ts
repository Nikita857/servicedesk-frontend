'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api/auth';
import { toaster } from '@/components/ui/toaster';
import type { AuthRequest } from '@/types/auth';

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
      
      toaster.success({
        title: 'Добро пожаловать!',
        description: `Вы вошли как ${user.fio || user.username}`,
      });
      
      router.push('/dashboard');
      return { success: true };
    } catch (error: unknown) {
      setIsLoggingIn(false);
      
      let message = 'Ошибка авторизации';
      if (error instanceof Error) {
        message = error.message;
      }
      
      toaster.error({
        title: 'Ошибка входа',
        description: message,
      });
      
      return { success: false, error: message };
    }
  }, [setAuth, router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      toaster.success({
        title: 'До свидания!',
        description: 'Вы успешно вышли из системы',
      });
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
