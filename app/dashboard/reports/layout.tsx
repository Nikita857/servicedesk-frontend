"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { Box, Flex, Spinner } from "@chakra-ui/react";

/**
 * Layout для раздела отчётов
 * Проверяет, что пользователь — администратор
 */
export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || false;
  const isSupervisor = user?.roles?.includes("SUPERVISOR") || false;
  const canViewReports = isAdmin || isSupervisor;

  useEffect(() => {
    if (isHydrated && !canViewReports) {
      router.replace("/dashboard");
    }
  }, [isHydrated, canViewReports, router]);

  if (!isHydrated) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!canViewReports) {
    return null;
  }

  return <Box>{children}</Box>;
}
