'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Spinner, Center } from '@chakra-ui/react';
import { useAuthStore } from '@/stores';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { Header } from '@/components/features/layout/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

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
