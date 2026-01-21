"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Icon,
  Separator,
  Button,
} from "@chakra-ui/react";
import {
  LuCamera,
  LuTrash2,
  LuShield,
  LuStar,
  LuCalendar,
} from "react-icons/lu";
import { ProfileResponse } from "@/lib/api/profile";
import { userRolesBadges } from "@/types/auth";

interface ProfileSidebarProps {
  profile: ProfileResponse;
  onAvatarClick: () => void;
  onDeleteAvatar: () => void;
  isDeletingAvatar: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileSidebar({
  profile,
  onAvatarClick,
  onDeleteAvatar,
  isDeletingAvatar,
  fileInputRef,
  onFileChange,
}: ProfileSidebarProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={6}
    >
      {/* Avatar */}
      <VStack gap={4} mb={6}>
        <Box position="relative">
          <Avatar.Root
            size="2xl"
            w="130px"
            h="130px"
            cursor="pointer"
            onClick={onAvatarClick}
          >
            <Avatar.Fallback name={profile.fio || profile.username} />
            {profile.avatarUrl && <Avatar.Image src={profile.avatarUrl} />}
          </Avatar.Root>
          <Box
            position="absolute"
            bottom={0}
            right={0}
            bg="blue.500"
            borderRadius="full"
            w={8}
            h={8}
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={onAvatarClick}
            _hover={{ bg: "blue.600" }}
          >
            <Icon as={LuCamera} color="white" boxSize={4} />
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </Box>

        {profile.avatarUrl && (
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={onDeleteAvatar}
            loading={isDeletingAvatar}
          >
            <Icon as={LuTrash2} mr={1} />
            Удалить аватар
          </Button>
        )}

        <Text fontSize="xl" fontWeight="semibold" color="fg.default">
          {profile.fio || profile.username}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          @{profile.username}
        </Text>
      </VStack>

      <Separator mb={4} />

      {/* Roles */}
      <VStack align="start" gap={3} mb={4}>
        <HStack gap={2}>
          <Icon as={LuShield} color="fg.muted" />
          <Text fontSize="sm" color="fg.muted">
            Роли:
          </Text>
        </HStack>
        <HStack flexWrap="wrap" gap={2}>
          {profile.roles.map((role) => {
            const roleInfo = userRolesBadges[role] || {
              name: role,
              color: "gray",
            };
            return (
              <Badge key={role} colorPalette={roleInfo.color} size="sm">
                {roleInfo.name}
              </Badge>
            );
          })}
        </HStack>
      </VStack>

      {/* Specialist Rating */}
      {profile.isSpecialist && profile.averageRating !== null && (
        <HStack gap={2} mb={4}>
          <Icon as={LuStar} color="yellow.500" />
          <Text fontSize="sm">
            Средняя оценка:{" "}
            <Text as="span" fontWeight="semibold">
              {profile.averageRating.toFixed(1)}
            </Text>
            <Text as="span" color="fg.muted">
              {" "}
              ({profile.ratedTicketsCount} отзывов)
            </Text>
          </Text>
        </HStack>
      )}

      {/* Registration date */}
      <HStack gap={2}>
        <Icon as={LuCalendar} color="fg.muted" />
        <Text fontSize="sm" color="fg.muted">
          Зарегистрирован:{" "}
          {new Date(profile.createdAt).toLocaleDateString("ru-RU")}
        </Text>
      </HStack>
    </Box>
  );
}
