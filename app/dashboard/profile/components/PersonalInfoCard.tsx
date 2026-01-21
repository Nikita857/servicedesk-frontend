"use client";

import {
  Box,
  VStack,
  HStack,
  Heading,
  Field,
  Input,
  Button,
  Icon,
} from "@chakra-ui/react";
import { LuUser, LuSave } from "react-icons/lu";
import { ProfileResponse } from "@/lib/api/profile";

interface PersonalInfoCardProps {
  profile: ProfileResponse;
  fio: string;
  setFio: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  onSave: () => void;
  isPending: boolean;
}

export function PersonalInfoCard({
  profile,
  fio,
  setFio,
  email,
  setEmail,
  onSave,
  isPending,
}: PersonalInfoCardProps) {
  const isChanged =
    fio !== (profile.fio || "") || email !== (profile.email || "");

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
        <Icon as={LuUser} color="blue.500" />
        <Heading size="md">Основная информация</Heading>
      </HStack>

      <VStack gap={4} align="stretch">
        <Field.Root>
          <Field.Label>ФИО</Field.Label>
          <Input
            value={fio}
            onChange={(e) => setFio(e.target.value)}
            placeholder="Иванов Иван Иванович"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </Field.Root>

        <Button
          colorPalette="blue"
          onClick={onSave}
          loading={isPending}
          disabled={!isChanged || isPending}
          mt="auto"
        >
          <Icon as={LuSave} mr={2} />
          Сохранить изменения
        </Button>
      </VStack>
    </Box>
  );
}
