"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Separator, Avatar, Portal } from "@chakra-ui/react";
import { LuSettings, LuUser, LuLogOut, LuChevronUp } from "react-icons/lu";
import { SenderType, User, userRolesBadges } from "@/types";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { getFullNameInitials, getShortInitials } from "@/lib/utils";

interface UserProfileMenuProps {
  user: User | null;
}

export function ProfileMenu({ user }: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ bottom: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

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
      const currentIdx = rolePriority.indexOf(role as SenderType);
      const topIdx = top ? rolePriority.indexOf(top as SenderType) : -1;
      return currentIdx > topIdx ? role : top;
    }, null) ?? "USER";

  const roleBadgeInfo = userRolesBadges[highestRole];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPopupPos({
        bottom: window.innerHeight - r.top + 6,
        left: r.left,
        width: r.width,
      });
    }
    setOpen((v) => !v);
  };

  const close = () => setOpen(false);

  return (
    <>
      {/* Popup */}
      {open && (
        <Portal>
          <Box
            position="fixed"
            bottom={`${popupPos.bottom}px`}
            left={`${popupPos.left}px`}
            w={`${popupPos.width}px`}
            bg="bg.surface"
            borderRadius="lg"
            boxShadow="lg"
            borderWidth="1px"
            borderColor="border.default"
            overflow="hidden"
            zIndex="popover"
            ref={popupRef}
          >
            {/* User info header */}
            <Box
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="border.default"
            >
              <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                @{user?.username}
              </Text>
              {user?.positionName && (
                <Text fontSize="xs" color="fg.muted">
                  {user.positionName}
                </Text>
              )}
            </Box>

            {/* Navigation items — используем href, Link обёртывает Flex */}
            <MenuItem
              icon={<LuUser size={16} />}
              label="Профиль"
              href="/dashboard/profile"
              onNavigate={close}
            />
            <MenuItem
              icon={<LuSettings size={16} />}
              label="Настройки"
              href="/dashboard/settings"
              onNavigate={close}
            />

            <Separator borderColor="border.default" />

            {/* Выход — без href, только action */}
            <MenuItem
              icon={<LuLogOut size={16} />}
              label="Выйти"
              danger
              onNavigate={() => {
                close();
                logout();
              }}
            />
          </Box>
        </Portal>
      )}

      {/* Trigger */}
      <Flex
        ref={triggerRef}
        px={3}
        py={2}
        borderRadius="lg"
        align="center"
        gap={3}
        cursor="pointer"
        onClick={handleToggle}
        bg={open ? "bg.subtle" : "transparent"}
        transition="background 0.15s"
        _hover={{ bg: "bg.subtle" }}
      >
        {/* Avatar */}
        <Avatar.Root size="xl">
          <Avatar.Fallback>
            <Text fontSize="small" fontWeight="semibold">
              {getShortInitials(user?.fio)}
            </Text>
          </Avatar.Fallback>
          {user?.avatarUrl && <Avatar.Image src={user.avatarUrl} />}
        </Avatar.Root>

        {/* Name + role */}
        <Box flex={1} minW={0}>
          <Text fontSize="md" fontWeight="medium" color="fg.default">
            {getFullNameInitials(user?.fio)}
          </Text>
          <Tooltip content={roleBadgeInfo.description}>
            <Text fontSize="xs" color={roleBadgeInfo.color}>
              {roleBadgeInfo.name}
            </Text>
          </Tooltip>
        </Box>

        {/* Chevron */}
        <Box
          color="fg.muted"
          transition="transform 0.2s"
          transform={open ? "rotate(180deg)" : "rotate(0deg)"}
        >
          <LuChevronUp size={14} />
        </Box>
      </Flex>
    </>
  );
}

// ─── Internal MenuItem ────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  /** Если передан — рендерится как Link, иначе как кнопка */
  href?: string;
  /** Вызывается при клике (закрытие попапа, logout и т.д.) */
  onNavigate: () => void;
  danger?: boolean;
}

function MenuItem({
  icon,
  label,
  href,
  onNavigate,
  danger = false,
}: MenuItemProps) {
  const router = useRouter();

  const handleClick = () => {
    onNavigate(); // закрываем попап
    if (href) router.push(href); // навигация через router — не зависит от монтирования
  };

  return (
    <Flex
      px={3}
      py={2.5}
      align="center"
      borderRadius="lg"
      gap={3}
      cursor="pointer"
      color={danger ? "red.500" : "fg.muted"}
      _hover={{
        bg: danger ? "red.500" : "bg.subtle",
        color: danger ? "white" : "fg.default",
      }}
      onClick={handleClick}
    >
      <Box color="inherit" transition="color 0.1s">
        {icon}
      </Box>
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );
}
