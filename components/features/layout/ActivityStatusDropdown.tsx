"use client";

import { Box, Flex, Text, Menu, Spinner, Circle } from "@chakra-ui/react";
import { LuChevronDown, LuCircle } from "react-icons/lu";
import { useUserStatusQuery } from "@/lib/hooks/useUserStatusQuery";
import { activityStatusConfig, type UserActivityStatus } from "@/lib/api/users";
import { useAuthStore } from "@/stores";

const statusOrder: UserActivityStatus[] = [
  "AVAILABLE",
  "BUSY",
  "UNAVAILABLE",
  "TECHNICAL_ISSUE",
];

/**
 * Dropdown for specialists to change their activity status
 * Only shown to specialists, not regular users
 */
export function ActivityStatusDropdown() {
  const { user } = useAuthStore();
  const { status, isLoading, isUpdating, updateStatus } = useUserStatusQuery();

  // Only show for specialists
  const isSpecialist = user?.specialist || false;
  if (!isSpecialist) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Box px={2}>
        <Spinner size="sm" />
      </Box>
    );
  }

  // No status available (error or not set)
  if (!status) {
    return null;
  }

  const currentConfig = activityStatusConfig[status];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={1.5}
          borderRadius="lg"
          cursor="pointer"
          transition="all 0.2s"
          bg="bg.subtle"
          _hover={{ bg: "bg.muted" }}
          opacity={isUpdating ? 0.7 : 1}
        >
          {/* Status indicator dot */}
          <Circle size="10px" bg={`${currentConfig.color}.500`} />

          <Text fontSize="sm" fontWeight="medium" color="fg.default">
            {currentConfig.label}
          </Text>

          <LuChevronDown size={14} color="var(--chakra-colors-fg-muted)" />
        </Flex>
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content bg="bg.surface" borderColor="border.default" minW="200px">
          {statusOrder.map((statusOption) => {
            const config = activityStatusConfig[statusOption];
            const isSelected = statusOption === status;

            return (
              <Menu.Item
                key={statusOption}
                value={statusOption}
                gap={3}
                fontSize="sm"
                onClick={() => !isSelected && updateStatus(statusOption)}
                bg={isSelected ? "bg.subtle" : undefined}
              >
                <Circle size="10px" bg={`${config.color}.500`} />
                <Box flex={1}>
                  <Text fontWeight={isSelected ? "semibold" : "normal"}>
                    {config.label}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {config.description}
                  </Text>
                </Box>
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
