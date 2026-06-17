"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
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
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();
  const canViewReports = has(PERM.REPORT_VIEW);

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
