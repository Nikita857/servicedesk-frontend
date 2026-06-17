"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Switch,
  Textarea,
  Input,
  Button,
  Field,
  Badge,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { LuWrench } from "react-icons/lu";
import { useMaintenanceSettings } from "@/lib/hooks/admin-maintenance";

const MESSAGE_MAX = 500;

/** ISO/Instant → значение для <input type="datetime-local"> (в локальном времени). */
function toLocalInputValue(isoString: string): string {
  const dt = new Date(isoString);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/** Текущее локальное время как min для datetime-local. */
function getLocalNow(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function MaintenancePage() {
  const { settings, isLoading, updateSettings, isUpdating } =
    useMaintenanceSettings();

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");

  // Синхронизируем форму с загруженными настройками.
  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setMessage(settings.message ?? "");
    setEndsAtLocal(settings.endsAt ? toLocalInputValue(settings.endsAt) : "");
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      enabled,
      message: message.trim() ? message.trim() : null,
      // datetime-local трактуется как локальное время → конвертируем в UTC ISO.
      endsAt: endsAtLocal ? new Date(endsAtLocal).toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={20}>
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box maxW="640px" mx="auto" py={6} px={4}>
      <HStack gap={3} mb={2}>
        <Icon as={LuWrench} boxSize={6} color="fg.muted" />
        <Heading size="lg" color="fg.default">
          Режим обслуживания
        </Heading>
        <Badge colorPalette={settings?.enabled ? "orange" : "green"}>
          {settings?.enabled ? "Включён" : "Выключен"}
        </Badge>
      </HStack>
      <Text fontSize="sm" color="fg.muted" mb={6}>
        Когда режим включён, все пользователи видят экран технических работ.
        Эта страница и страница входа остаются доступны, чтобы вы могли
        выключить режим.
      </Text>

      <VStack
        gap={5}
        align="stretch"
        bg="bg.surface"
        border="1px solid"
        borderColor="border.default"
        borderRadius="xl"
        p={6}
      >
        <Field.Root>
          <HStack justify="space-between" w="full">
            <VStack align="start" gap={0}>
              <Field.Label>Режим обслуживания</Field.Label>
              <Text fontSize="xs" color="fg.subtle">
                Включить экран технических работ для всех пользователей
              </Text>
            </VStack>
            <Switch.Root
              colorPalette="orange"
              size="lg"
              checked={enabled}
              onCheckedChange={({ checked }) => setEnabled(checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </Field.Root>

        <Field.Root>
          <Field.Label>Сообщение для пользователей</Field.Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Мы обновляем систему. Веб сервис временно недоступен."
            maxLength={MESSAGE_MAX}
            rows={3}
          />
          <Field.HelperText>
            {message.length}/{MESSAGE_MAX}. Если пусто — покажется текст по
            умолчанию.
          </Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>Ожидаемое время завершения</Field.Label>
          <Input
            type="datetime-local"
            value={endsAtLocal}
            min={getLocalNow()}
            onChange={(e) => setEndsAtLocal(e.target.value)}
          />
          <Field.HelperText>
            Используется для счётчика обратного отсчёта. Можно оставить пустым.
          </Field.HelperText>
        </Field.Root>

        <HStack justify="space-between" pt={2}>
          <Text fontSize="xs" color="fg.subtle">
            {settings?.updatedAt
              ? `Обновлено: ${new Date(settings.updatedAt).toLocaleString("ru-RU")}`
              : ""}
          </Text>
          <Button
            colorPalette="orange"
            onClick={handleSave}
            loading={isUpdating}
          >
            Сохранить
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
