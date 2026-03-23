"use client";

import { useState, useEffect } from "react";
import { Box, Heading, Text, Flex, Spinner } from "@chakra-ui/react";
import { useNotificationSettings } from "@/lib/hooks/notification/useNotificationSettings";
import { NotificationSettingsCard } from "@/components/features/notification/NotificationSettingsCard";
import { NotificationSettingResponse } from "@/types";

export default function SettingsPage() {
    const { listSettings, saveSettingsMutation } = useNotificationSettings();
    const [localSettings, setLocalSettings] = useState<NotificationSettingResponse[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Initialize local state from server data (render-time, no useEffect)
    if (!initialized && listSettings.data) {
        setLocalSettings(listSettings.data);
        setInitialized(true);
    }

    // Re-sync after successful save
    useEffect(() => {
        if (saveSettingsMutation.isSuccess && listSettings.data) {
            setLocalSettings(listSettings.data);
        }
    }, [saveSettingsMutation.isSuccess, listSettings.data]);

    const hasChanges =
        initialized && JSON.stringify(localSettings) !== JSON.stringify(listSettings.data);

    const handleSave = () => {
        saveSettingsMutation.mutate({
            settings: localSettings.map((s) => ({
                type: s.type,
                inAppEnabled: s.inAppEnabled,
                telegramEnabled: s.telegramEnabled,
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
            </Box>
        </Box>
    );
}
