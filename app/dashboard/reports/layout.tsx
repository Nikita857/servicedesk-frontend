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

  useEffect(() => {
    // Дождёмся гидратации (загрузки пользователя из storage)
    if (isHydrated && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAdmin, router]);

  // Показываем спиннер пока идёт гидратация
  if (!isHydrated) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  // Если не админ — ничего не рендерим (будет редирект)
  if (!isAdmin) {
    return null;
  }

  return <Box>{children}</Box>;
}
