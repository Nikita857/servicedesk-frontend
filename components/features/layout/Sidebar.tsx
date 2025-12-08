'use client';

import { Box, VStack, Text, Flex, Icon } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LuTicket,
  LuLayoutDashboard,
  LuMessageSquare,
  LuBook,
  LuBarcode,
  LuSettings,
  LuUsers,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  { label: 'Дашборд', href: '/dashboard', icon: LuLayoutDashboard },
  { label: 'Тикеты', href: '/dashboard/tickets', icon: LuTicket },
  { label: 'Сообщения', href: '/dashboard/messages', icon: LuMessageSquare },
  { label: 'Wiki', href: '/dashboard/wiki', icon: LuBook },
  { label: 'Отчеты', href: '/dashboard/reports', icon: LuBarcode },
];

const adminItems: NavItem[] = [
  { label: 'Пользователи', href: '/dashboard/users', icon: LuUsers },
  { label: 'Настройки', href: '/dashboard/settings', icon: LuSettings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <Box
      w="260px"
      h="100vh"
      bg="bg.surface"
      borderRightWidth="1px"
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
          ServiceDesk
        </Text>
      </Flex>

      {/* Main Navigation */}
      <VStack gap={1} px={3} align="stretch" flex={1}>
        <Text px={2} py={2} fontSize="xs" fontWeight="medium" color="fg.muted" textTransform="uppercase">
          Меню
        </Text>
        
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Flex
              px={3}
              py={2.5}
              borderRadius="lg"
              align="center"
              gap={3}
              bg={isActive(item.href) ? 'bg.subtle' : 'transparent'}
              color={isActive(item.href) ? 'accent.600' : 'fg.muted'}
              fontWeight={isActive(item.href) ? 'medium' : 'normal'}
              transition="all 0.2s"
              _hover={{
                bg: 'bg.subtle',
                color: 'fg.default',
              }}
            >
              <Icon as={item.icon} boxSize={5} />
              <Text fontSize="sm">{item.label}</Text>
            </Flex>
          </Link>
        ))}

        {/* Admin Section */}
        <Text px={2} py={2} mt={4} fontSize="xs" fontWeight="medium" color="fg.muted" textTransform="uppercase">
          Управление
        </Text>
        
        {adminItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Flex
              px={3}
              py={2.5}
              borderRadius="lg"
              align="center"
              gap={3}
              bg={isActive(item.href) ? 'bg.subtle' : 'transparent'}
              color={isActive(item.href) ? 'accent.600' : 'fg.muted'}
              fontWeight={isActive(item.href) ? 'medium' : 'normal'}
              transition="all 0.2s"
              _hover={{
                bg: 'bg.subtle',
                color: 'fg.default',
              }}
            >
              <Icon as={item.icon} boxSize={5} />
              <Text fontSize="sm">{item.label}</Text>
            </Flex>
          </Link>
        ))}
      </VStack>
    </Box>
  );
}
