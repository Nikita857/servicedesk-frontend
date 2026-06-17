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
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { Sidebar } from "@/components/features/layout/Sidebar";
import { Header } from "@/components/features/layout/Header";
import { WebSocketProvider } from "@/lib/providers";
import { NotificationSubscriber } from "@/components/features/layout/NotificationSubscriber";
import { AssignmentSubscriber } from "@/components/features/layout/AssignmentSubscriber";
import {
  OnboardingOverlay,
  USER_ONBOARDING_STEPS,
} from "@/components/features/onboarding";
import { useOnboarding } from "@/lib/hooks/shared/useOnboarding";
import { useHeartbeat } from "@/lib/hooks";
import { useTabTitle } from "@/lib/hooks/shared/useTabTitle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { has } = useCurrentPermissions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Онбординг только для базовых пользователей без специальных прав
  const isOnlyUser = !!(
    user &&
    !has(PERM.TICKET_READ_LINE) &&
    !has(PERM.TICKET_READ_ALL) &&
    !has(PERM.USER_MANAGE)
  );
  const onboarding = useOnboarding(isOnlyUser);
  useHeartbeat();
  useTabTitle({
    isAdmin: has(PERM.REPORT_VIEW),
    isSpecialist: has(PERM.TICKET_READ_LINE) && !has(PERM.REPORT_VIEW),
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <Center h="100vh" bg="bg.canvas" suppressHydrationWarning>
        <Spinner size="xl" color="accent.500" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleOpenSidebar = () => setIsSidebarOpen(true);

  return (
    <WebSocketProvider>
      <NotificationSubscriber />
      <AssignmentSubscriber />

      {/* Онбординг — рендерится поверх всего интерфейса */}
      <OnboardingOverlay steps={USER_ONBOARDING_STEPS} controls={onboarding} />

      <Flex h="100vh" bg="bg.canvas" suppressHydrationWarning>
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
          <Header
            onMenuClick={handleOpenSidebar}
            onStartTutorial={onboarding.start}
            showTutorialButton={isOnlyUser}
          />

          <Box flex={1} overflow="auto" p={{ base: 4, md: 6 }} bg="bg.canvas">
            {children}
          </Box>
        </Flex>
      </Flex>
    </WebSocketProvider>
  );
}
