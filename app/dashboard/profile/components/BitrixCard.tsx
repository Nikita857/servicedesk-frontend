"use client";

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuBuilding2, LuCheck } from "react-icons/lu";
import type { ProfileResponse } from "@/lib/api/profile";

interface BitrixCardProps {
  profile: ProfileResponse;
  bitrixUserId: string;
  setBitrixUserId: (val: string) => void;
  onUpdate: () => void;
  isPending: boolean;
}

export function BitrixCard({
  profile,
  bitrixUserId,
  setBitrixUserId,
  onUpdate,
  isPending,
}: BitrixCardProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={6}
      height="100%"
    >
      <HStack mb={4}>
        <Icon as={LuBuilding2} color="blue.400" />
        <Heading size="md">Bitrix24</Heading>
        {profile.socialNetwork.bitrixUserId && (
          <Badge colorPalette="green" size="sm">
            <Icon as={LuCheck} mr={1} />
            Привязан
          </Badge>
        )}
      </HStack>

      <Text fontSize="sm" color="fg.muted" mb={4}>
        Укажите ID пользователя Bitrix24, чтобы получать уведомления в Bitrix24.
      </Text>

      <VStack gap={4} align="stretch" mt="auto">
        <HStack gap={3}>
          <Input
            value={bitrixUserId}
            onChange={(e) => setBitrixUserId(e.target.value)}
            placeholder="ID пользователя Bitrix24"
            type="number"
            flex={1}
          />
          <Button
            colorPalette="blue"
            onClick={onUpdate}
            loading={isPending}
            disabled={!bitrixUserId || isPending}
          >
            Привязать
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
