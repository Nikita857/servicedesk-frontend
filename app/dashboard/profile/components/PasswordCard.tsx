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
import { LuLock, LuSave } from "react-icons/lu";

interface PasswordCardProps {
  oldPassword: string;
  setOldPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  onUpdate: () => void;
  isPending: boolean;
}

export function PasswordCard({
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onUpdate,
  isPending,
}: PasswordCardProps) {
  const isDisabled =
    !oldPassword || !newPassword || !confirmPassword || isPending;

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
        <Icon as={LuLock} color="orange.500" />
        <Heading size="md">Изменение пароля</Heading>
      </HStack>

      <VStack gap={4} align="stretch">
        <Field.Root>
          <Field.Label>Текущий пароль</Field.Label>
          <Input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Новый пароль</Field.Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Подтверждение пароля</Field.Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field.Root>

        <Button
          colorPalette="orange"
          onClick={onUpdate}
          loading={isPending}
          disabled={isDisabled}
          mt="auto"
        >
          <Icon as={LuLock} mr={2} />
          Сменить пароль
        </Button>
      </VStack>
    </Box>
  );
}
