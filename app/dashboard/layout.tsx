"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Spinner,
  Center,
  Drawer,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { useAuthStore } from "@/stores";
import { Sidebar } from "@/components/features/layout/Sidebar";
import { Header } from "@/components/features/layout/Header";
import { WebSocketProvider } from "@/lib/providers";
import { NotificationSubscriber } from "@/components/features/layout/NotificationSubscriber";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Wait for hydration, then check auth
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
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

  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleOpenSidebar = () => setIsSidebarOpen(true);

  return (
    <WebSocketProvider>
      {/* Подписка на уведомления через централизованный WebSocket */}
      <NotificationSubscriber />

      <Flex h="100vh" bg="bg.canvas">
        {/* Desktop Sidebar - hidden on mobile */}
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        {/* Mobile Sidebar Drawer */}
        <Drawer.Root
          open={isSidebarOpen}
          onOpenChange={(e) => setIsSidebarOpen(e.open)}
          placement="start"
        >
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content bg="bg.surface" maxW="280px">
                <Drawer.CloseTrigger asChild>
                  <CloseButton
                    size="sm"
                    position="absolute"
                    top="3"
                    right="3"
                    zIndex={10}
                  />
                </Drawer.CloseTrigger>
                <Sidebar onClose={handleCloseSidebar} />
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>

        {/* Main Content */}
        <Flex flex={1} direction="column" overflow="hidden">
          {/* Header with burger menu */}
          <Header onMenuClick={handleOpenSidebar} />

          {/* Page Content */}
          <Box flex={1} overflow="auto" p={{ base: 4, md: 6 }} bg="bg.canvas">
            {children}
          </Box>
        </Flex>
      </Flex>
    </WebSocketProvider>
  );
}
