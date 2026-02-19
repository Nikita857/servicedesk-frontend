"use client";

import {
  Box,
  Flex,
  Text,
  Menu,
  Avatar,
  IconButton,
  HStack,
  Badge,
} from "@chakra-ui/react";
import {
  LuBell,
  LuLogOut,
  LuSettings,
  LuUser,
  LuChevronDown,
  LuMenu,
  LuBookOpen,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthStore } from "@/stores";
import { userRolesBadges } from "@/types/auth";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ActivityStatusDropdown } from "./ActivityStatusDropdown";
import { Tooltip } from "@/components/ui/tooltip";

interface HeaderProps {
  onMenuClick?: () => void;
  onStartTutorial?: () => void;
  showTutorialButton?: boolean;
}

export function Header({
  onMenuClick,
  onStartTutorial,
  showTutorialButton,
}: HeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuthStore();

  const rolePriority = [
    "USER",
    "SYSADMIN",
    "ONE_C_SUPPORT",
    "DEV1C",
    "DEVELOPER",
    "ADMIN",
  ] as const;

  const highestRole =
    user?.roles?.reduce<string | null>((top, role) => {
      const currentIdx = rolePriority.indexOf(role as any);
      const topIdx = top ? rolePriority.indexOf(top as any) : -1;
      return currentIdx > topIdx ? role : top;
    }, null) ?? "USER";

  const roleBadgeInfo = userRolesBadges[highestRole];

  return (
    <Box
      h="60px"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderColor="border.default"
      px={{ base: 3, md: 6 }}
    >
      <Flex h="full" align="center" justify="space-between">
        {/* Left side: burger menu (mobile) */}
        <HStack gap={3}>
          <IconButton
            aria-label="Открыть меню"
            variant="ghost"
            size="sm"
            display={{ base: "flex", lg: "none" }}
            onClick={onMenuClick}
            color="fg.muted"
            _hover={{ bg: "bg.subtle", color: "fg.default" }}
          >
            <LuMenu size={20} />
          </IconButton>
        </HStack>

        {/* Right side: controls & profile */}
        <HStack gap={{ base: 1, md: 3 }}>
          {/* Activity Status (specialists only) */}
          <ActivityStatusDropdown />

          {/* Tutorial restart button — only for USER role */}
          {showTutorialButton && (
            <Tooltip
              content="Показать обучение"
              showArrow
              positioning={{ placement: "bottom" }}
            >
              <IconButton
                aria-label="Запустить обучение"
                variant="ghost"
                size="sm"
                color="fg.muted"
                _hover={{ bg: "bg.subtle", color: "fg.default" }}
                onClick={onStartTutorial}
              >
                <LuBookOpen size={20} />
              </IconButton>
            </Tooltip>
          )}

          {/* Theme switcher */}
          <ThemeSwitcher />

          {/* Notifications */}
          <IconButton
            aria-label="Уведомления"
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: "bg.subtle", color: "fg.default" }}
            data-onboarding-id="onboarding-notifications"
          >
            <LuBell size={20} />
          </IconButton>

          {/* Profile Menu */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <Flex
                align="center"
                gap={2}
                px={2}
                py={1.5}
                borderRadius="lg"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: "bg.subtle" }}
                data-onboarding-id="onboarding-profile"
              >
                <Avatar.Root size="sm">
                  <Avatar.Fallback name={user?.fio || user?.username} />
                  {user?.avatarUrl && <Avatar.Image src={user.avatarUrl} />}
                </Avatar.Root>

                <Box display={{ base: "none", md: "block" }}>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="fg.default"
                    lineHeight="1.2"
                  >
                    {user?.fio || user?.username}
                  </Text>
                  <Tooltip
                    content={roleBadgeInfo.description}
                    showArrow
                    positioning={{ placement: "bottom" }}
                  >
                    <Badge
                      colorPalette={roleBadgeInfo.color}
                      cursor="help"
                      size="xs"
                    >
                      {roleBadgeInfo.name}
                    </Badge>
                  </Tooltip>
                </Box>

                <LuChevronDown
                  size={16}
                  color="var(--chakra-colors-fg-muted)"
                />
              </Flex>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content bg="bg.surface" borderColor="border.default">
                <Menu.Item
                  value="profile"
                  gap={2}
                  fontSize="sm"
                  onClick={() => router.push("/dashboard/profile")}
                >
                  <LuUser size={16} />
                  Профиль
                </Menu.Item>
                <Menu.Item
                  value="settings"
                  gap={2}
                  fontSize="sm"
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <LuSettings size={16} />
                  Настройки
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="logout"
                  gap={2}
                  fontSize="sm"
                  color="fg.error"
                  onClick={logout}
                >
                  <LuLogOut size={16} />
                  Выйти
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </HStack>
      </Flex>
    </Box>
  );
}
