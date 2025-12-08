'use client';

import { Box, Flex, Text, Menu, Avatar, IconButton, HStack } from '@chakra-ui/react';
import { LuBell, LuLogOut, LuSettings, LuUser, LuChevronDown } from 'react-icons/lu';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/stores';

export function Header() {
  const { logout } = useAuth();
  const { user } = useAuthStore();

  return (
    <Box
      h="60px"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderColor="border.default"
      px={6}
    >
      <Flex h="full" align="center" justify="space-between">
        {/* Search or breadcrumb area */}
        <Box>
          <Text color="fg.muted" fontSize="sm">
            Добро пожаловать, <Text as="span" fontWeight="medium" color="fg.default">{user?.fio || user?.username}</Text>
          </Text>
        </Box>

        {/* Right side: notifications & profile */}
        <HStack gap={3}>
          {/* Notifications */}
          <IconButton
            aria-label="Уведомления"
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'bg.subtle', color: 'fg.default' }}
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
                _hover={{ bg: 'bg.subtle' }}
              >
                <Avatar.Root size="sm">
                  <Avatar.Fallback name={user?.fio || user?.username} />
                </Avatar.Root>
                <Text fontSize="sm" fontWeight="medium" color="fg.default" display={{ base: 'none', md: 'block' }}>
                  {user?.fio || user?.username}
                </Text>
                <LuChevronDown size={16} color="var(--chakra-colors-fg-muted)" />
              </Flex>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content bg="bg.surface" borderColor="border.default">
                <Menu.Item value="profile" gap={2} fontSize="sm">
                  <LuUser size={16} />
                  Профиль
                </Menu.Item>
                <Menu.Item value="settings" gap={2} fontSize="sm">
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
