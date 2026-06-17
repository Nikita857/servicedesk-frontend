"use client";

import { Box, VStack, Text, Flex, Icon, Separator } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuTicket,
  LuLayoutDashboard,
  LuBook,
  LuBarcode,
  LuSettings,
  LuUsers,
  LuNetwork,
  LuSearch,
  LuClipboardList,
  LuRoute,
  LuTag,
  LuCalendarClock,
  LuBuilding2,
  LuShieldCheck,
  LuWrench,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { useColorMode } from "@/components/ui/color-mode";
import { useAuthStore } from "@/stores";
import { ProfileMenu } from "./ProfileMenu";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface SidebarProps {
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LuLayoutDashboard },
  { label: "Заявки", href: "/dashboard/tickets", icon: LuTicket },
  {
    label: "Мои обращения",
    href: "/dashboard/my-tickets",
    icon: LuClipboardList,
  },
  //{ label: "Сообщения", href: "/dashboard/messages", icon: LuMessageSquare },
  { label: "Статьи", href: "/dashboard/wiki", icon: LuBook },
  { label: "Отчеты", href: "/dashboard/reports", icon: LuBarcode },
];

const onboardingIds: Record<string, string> = {
  "/dashboard": "onboarding-dashboard",
  "/dashboard/tickets": "onboarding-tickets",
  "/dashboard/wiki": "onboarding-wiki",
};

interface AdminNavItem extends NavItem {
  perm: string;
}

const adminItems: AdminNavItem[] = [
  { label: "Пользователи", href: "/dashboard/admin/users", icon: LuUsers, perm: PERM.USER_MANAGE },
  { label: "Роли", href: "/dashboard/admin/roles", icon: LuShieldCheck, perm: PERM.ROLE_MANAGE },
  { label: "Отделы", href: "/dashboard/admin/departments", icon: LuBuilding2, perm: PERM.DEPARTMENT_MANAGE },
  { label: "Линии поддержки", href: "/dashboard/admin/support-lines", icon: LuNetwork, perm: PERM.SUPPORT_LINE_MANAGE },
  { label: "Маршрутизация", href: "/dashboard/admin/forwarding-rules", icon: LuRoute, perm: PERM.FORWARDING_RULE_MANAGE },
  { label: "Планировщик задач", href: "/dashboard/admin/scheduled-tasks", icon: LuCalendarClock, perm: PERM.SCHEDULED_TASK_MANAGE },
  { label: "Категории заявок", href: "/dashboard/admin/categories", icon: LuTag, perm: PERM.CATEGORY_MANAGE },
  { label: "Категории статей", href: "/dashboard/admin/wiki-categories", icon: LuBook, perm: PERM.WIKI_CATEGORY_MANAGE },
  { label: "Поиск", href: "/dashboard/admin/search", icon: LuSearch, perm: PERM.ELASTICSEARCH_ADMIN },
  { label: "Режим обслуживания", href: "/dashboard/admin/maintenance", icon: LuWrench, perm: PERM.MAINTENANCE_MANAGE },
  { label: "Настройки", href: "/dashboard/settings", icon: LuSettings, perm: PERM.NOTIFICATION_SETTINGS_MANAGE },
];

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { colorMode } = useColorMode();
  const { user } = useAuthStore();
  const { has } = useCurrentPermissions();

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard/tickets") return has(PERM.TICKET_READ_OWN);
    if (item.href === "/dashboard/reports") return has(PERM.REPORT_VIEW);
    // "Мои обращения" — для специалистов линии, у которых нет доступа ко всем тикетам
    if (item.href === "/dashboard/my-tickets")
      return has(PERM.TICKET_READ_LINE) && !has(PERM.TICKET_READ_ALL);
    return true;
  });

  const visibleAdminItems = adminItems.filter((item) => has(item.perm));
  const showAdminSection = visibleAdminItems.length > 0;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <Box
      w={{ base: "full", lg: "260px" }}
      h="100vh"
      bg="bg.surface"
      borderRightWidth={{ base: 0, lg: "1px" }}
      borderColor="border.default"
      py={4}
      display="flex"
      flexDirection="column"
    >
      {/* Logo */}
      <Flex px={5} py={3} mb={4} align="center" gap={3}>
        <Box
          w={8}
          h={8}
          borderRadius="lg"
          bg="accent.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="white" fontWeight="bold" fontSize="sm">
            SD
          </Text>
        </Box>
        <Text fontWeight="semibold" fontSize="lg" color="fg.default">
          Service Desk
        </Text>
      </Flex>

      {/* Main Navigation */}
      <Box flex={1} overflowY="auto">
        <VStack gap={1} px={3} align="stretch">
          <Text
            px={2}
            py={2}
            fontSize="xs"
            fontWeight="medium"
            color="fg.muted"
            textTransform="uppercase"
          >
            Меню
          </Text>

          {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={handleLinkClick}>
              <Flex
                px={3}
                py={2.5}
                borderRadius="lg"
                align="center"
                gap={3}
                bg={isActive(item.href) ? "bg.subtle" : "transparent"}
                color={
                  isActive(item.href)
                    ? colorMode === "dark"
                      ? "accent.100"
                      : "accent.900"
                    : "fg.muted"
                }
                fontWeight={isActive(item.href) ? "medium" : "normal"}
                transition="all 0.2s"
                _hover={{
                  bg: "bg.subtle",
                  color: "fg.default",
                }}
                data-onboarding-id={onboardingIds[item.href]}
              >
                <Icon as={item.icon} boxSize={5} />
                <Text fontSize="sm">{item.label}</Text>
              </Flex>
            </Link>
          ))}

          {showAdminSection && (
            <>
              <Text
                px={2}
                py={2}
                mt={4}
                fontSize="xs"
                fontWeight="medium"
                color="fg.muted"
                textTransform="uppercase"
              >
                Управление
              </Text>

              {visibleAdminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                >
                  <Flex
                    px={3}
                    py={2.5}
                    borderRadius="lg"
                    align="center"
                    gap={3}
                    bg={isActive(item.href) ? "bg.subtle" : "transparent"}
                    color={isActive(item.href) ? "accent.600" : "fg.muted"}
                    fontWeight={isActive(item.href) ? "medium" : "normal"}
                    transition="all 0.2s"
                    _hover={{
                      bg: "bg.subtle",
                      color: "fg.default",
                    }}
                  >
                    <Icon as={item.icon} boxSize={5} />
                    <Text fontSize="sm">{item.label}</Text>
                  </Flex>
                </Link>
              ))}
            </>
          )}
        </VStack>
      </Box>
      <Box px={3} pt={4}>
        <Separator mb={4} />
        <ProfileMenu user={user} />
      </Box>
    </Box>
  );
}
