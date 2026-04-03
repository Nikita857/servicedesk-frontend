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
import { FaVk } from "react-icons/fa";
import { LuCheck } from "react-icons/lu";
import { ProfileResponse } from "@/lib/api/profile";

interface VkCardProps {
  profile: ProfileResponse;
  vkId: string;
  setVkId: (val: string) => void;
  onUpdate: () => void;
  isPending: boolean;
}

export function VkCard({
  profile,
  vkId,
  setVkId,
  onUpdate,
  isPending,
}: VkCardProps) {
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
        <Icon as={FaVk} color="blue.500" />
        <Heading size="md">ВКонтакте</Heading>
        {profile.socialNetwork.vkId && (
          <Badge colorPalette="green" size="sm">
            <Icon as={LuCheck} mr={1} />
            Привязан
          </Badge>
        )}
      </HStack>

      <Text fontSize="sm" color="fg.muted" mb={4}>
        Привяжите VK для получения уведомлений. Ваш VK ID — числовой идентификатор
        страницы, виден в адресной строке: vk.com/id<Text as="strong">123456</Text>
      </Text>

      <VStack gap={4} align="stretch" mt="auto">
        <HStack gap={3}>
          <Input
            value={vkId}
            onChange={(e) => setVkId(e.target.value)}
            placeholder="VK ID"
            type="number"
            flex={1}
          />
          <Button
            colorPalette="blue"
            onClick={onUpdate}
            loading={isPending}
            disabled={!vkId || isPending}
          >
            Привязать
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
