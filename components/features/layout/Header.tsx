"use client";

import { Box, Flex, IconButton, HStack } from "@chakra-ui/react";
import { LuMenu, LuBookOpen } from "react-icons/lu";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ActivityStatusDropdown } from "./ActivityStatusDropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/features/notification/NotificationBell";

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
          <NotificationBell />
        </HStack>
      </Flex>
    </Box>
  );
}
