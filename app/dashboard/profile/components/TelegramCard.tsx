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
  Link,
} from "@chakra-ui/react";
import { FaTelegram } from "react-icons/fa";
import { LuCheck, LuSave } from "react-icons/lu";
import { ProfileResponse } from "@/lib/api/profile";

interface TelegramCardProps {
  profile: ProfileResponse;
  telegramId: string;
  setTelegramId: (val: string) => void;
  onUpdate: () => void;
  isPending: boolean;
}

export function TelegramCard({
  profile,
  telegramId,
  setTelegramId,
  onUpdate,
  isPending,
}: TelegramCardProps) {
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
        <Icon as={FaTelegram} color="blue.400" />
        <Heading size="md">Telegram</Heading>
        {profile.telegramId && (
          <Badge colorPalette="green" size="sm">
            <Icon as={LuCheck} mr={1} />
            Привязан
          </Badge>
        )}
      </HStack>

      <Text fontSize="sm" color="fg.muted" mb={4}>
        Привяжите Telegram для получения уведомлений. Ваш Telegram ID можно
        узнать у бота <Link href="https://t.me/userinfobot">@userinfobot</Link>
      </Text>

      <VStack gap={4} align="stretch" mt="auto">
        <HStack gap={3}>
          <Input
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="Telegram ID"
            type="number"
            flex={1}
          />
          <Button
            colorPalette="blue"
            onClick={onUpdate}
            loading={isPending}
            disabled={!telegramId || isPending}
          >
            Привязать
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
