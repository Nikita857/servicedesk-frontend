'use client';

import { useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Spinner, Center } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { Header } from '@/components/features/layout/Header';
import { 
  connectNotifications, 
  disconnectNotifications 
} from '@/lib/websocket/notificationWebSocket';
import type { Notification } from '@/types/notification';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, accessToken } = useAuthStore();

  // Handle incoming notifications
  const handleNotification = useCallback((notification: Notification) => {
    const toastType = notification.type === 'MESSAGE' ? 'info' : 
                      notification.type === 'STATUS_CHANGE' ? 'info' : 
                      notification.type === 'ASSIGNMENT' ? 'success' : 'info';
    
    toaster.create({
      title: notification.title,
      description: notification.body,
      type: toastType,
      duration: 5000,
      meta: {
        closable: true,
      },
    });
  }, []);

  // Connect to notification WebSocket when authenticated
  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.id && accessToken) {
      connectNotifications(
        user.id,
        accessToken,
        handleNotification,
        () => console.log('[Dashboard] Notifications connected'),
        () => console.log('[Dashboard] Notifications disconnected')
      );

      return () => {
        disconnectNotifications();
      };
    }
  }, [isHydrated, isAuthenticated, user?.id, accessToken, handleNotification]);

  useEffect(() => {
    // Wait for hydration, then check auth
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // Show loading while hydrating from localStorage
  if (!isHydrated) {
    return (
      <Center h="100vh" bg="bg.canvas">
        <Spinner size="xl" color="accent.500" />
      </Center>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Flex h="100vh" bg="bg.canvas">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <Flex flex={1} direction="column" overflow="hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <Box
          flex={1}
          overflow="auto"
          p={6}
          bg="bg.canvas"
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

