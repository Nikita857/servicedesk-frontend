"use client";

import { useState } from "react";
import { Box, Heading, Text, Flex, Spinner, Button } from "@chakra-ui/react";
import { LuDatabase } from "react-icons/lu";
import { useNotificationSettings } from "@/lib/hooks/notification/useNotificationSettings";
import { useBackup } from "@/lib/hooks/admin-backup/useBackup";
import { NotificationSettingsCard } from "@/components/features/notification/NotificationSettingsCard";
import { NotificationSettingResponse } from "@/types";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";

export default function SettingsPage() {
  const { listSettings, saveSettingsMutation } = useNotificationSettings();
  const { runBackup } = useBackup();
  const { has } = useCurrentPermissions();
  const [localSettings, setLocalSettings] = useState<
    NotificationSettingResponse[]
  >([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize local state from server data (render-time, no useEffect)
  if (!initialized && listSettings.data) {
    setLocalSettings(listSettings.data);
    setInitialized(true);
  }

  const hasChanges =
    initialized &&
    JSON.stringify(localSettings) !== JSON.stringify(listSettings.data);

  const handleSave = () => {
    saveSettingsMutation.mutate({
      settings: localSettings.map((s) => ({
        type: s.type,
        inAppEnabled: s.inAppEnabled,
        telegramEnabled: s.telegramEnabled,
        vkEnabled: s.vkEnabled,
        maxEnabled: s.maxEnabled,
      })),
    });
  };

  if (listSettings.isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (listSettings.isError) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="fg.muted">Не удалось загрузить настройки</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page header — same pattern as profile page */}
      <Flex mb={4} justify="space-between" align="center" flexShrink={0}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Настройки
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление уведомлениями и параметрами аккаунта
          </Text>
        </Box>
      </Flex>

      <Box maxW="700px">
        <NotificationSettingsCard
          settings={localSettings}
          onSettingsChange={setLocalSettings}
          onSave={handleSave}
          isSaving={saveSettingsMutation.isPending}
          hasChanges={hasChanges}
        />

        {has(PERM.BACKUP_MANAGE) && (
          <Box
            mt={6}
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={5}
          >
            <Heading size="sm" color="fg.default" mb={1}>
              Резервное копирование
            </Heading>
            <Text fontSize="sm" color="fg.muted" mb={4}>
              Запускает резервное копирование базы данных и файлового сервера
              MinIO.
            </Text>
            <Button
              onClick={() => runBackup.mutate()}
              loading={runBackup.isPending}
              colorPalette="blue"
              variant="outline"
              size="sm"
            >
              <LuDatabase />
              Запустить бэкап
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
