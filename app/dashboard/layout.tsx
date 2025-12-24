"use client";

import { useEffect, ReactNode, useCallback, useState } from "react";
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
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import { Sidebar } from "@/components/features/layout/Sidebar";
import { Header } from "@/components/features/layout/Header";
import {
  connectNotifications,
  disconnectNotifications,
} from "@/lib/websocket/notificationWebSocket";
import { WebSocketProvider } from "@/lib/providers";
import type { Notification } from "@/types/notification";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, accessToken } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle incoming notifications
  const handleNotification = useCallback((notification: Notification) => {
    const toastType =
      notification.type === "MESSAGE"
        ? "info"
        : notification.type === "STATUS_CHANGE"
        ? "info"
        : notification.type === "ASSIGNMENT"
        ? "success"
        : "info";

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
        () => console.log("[Dashboard] Notifications connected"),
        () => console.log("[Dashboard] Notifications disconnected")
      );

      return () => {
        disconnectNotifications();
      };
    }
  }, [isHydrated, isAuthenticated, user?.id, accessToken, handleNotification]);

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
