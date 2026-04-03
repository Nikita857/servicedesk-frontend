"use client";

import {
  Box,
  VStack,
  HStack,
  Heading,
  Badge,
  Text,
  Input,
  Button,
  Icon,
} from "@chakra-ui/react";
import { LuCheck, LuMessageCircle } from "react-icons/lu";
import { ProfileResponse } from "@/lib/api/profile";

interface MaxCardProps {
  profile: ProfileResponse;
  maxId: string;
  setMaxId: (val: string) => void;
  onUpdate: () => void;
  isPending: boolean;
}

export function MaxCard({
  profile,
  maxId,
  setMaxId,
  onUpdate,
  isPending,
}: MaxCardProps) {
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
        <Icon as={LuMessageCircle} color="purple.400" />
        <Heading size="md">MAX</Heading>
        {profile.socialNetwork.maxId && (
          <Badge colorPalette="green" size="sm">
            <Icon as={LuCheck} mr={1} />
            Привязан
          </Badge>
        )}
      </HStack>

      <Text fontSize="sm" color="fg.muted" mb={4}>
        Привяжите MAX (Mail.ru) для получения уведомлений. Ваш MAX ID можно
        узнать в настройках профиля мессенджера.
      </Text>

      <VStack gap={4} align="stretch" mt="auto">
        <HStack gap={3}>
          <Input
            value={maxId}
            onChange={(e) => setMaxId(e.target.value)}
            placeholder="MAX ID"
            type="number"
            flex={1}
          />
          <Button
            colorPalette="purple"
            onClick={onUpdate}
            loading={isPending}
            disabled={!maxId || isPending}
          >
            Привязать
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
