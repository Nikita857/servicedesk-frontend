"use client";

import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Icon,
    Switch,
    Separator,
} from "@chakra-ui/react";
import {
    LuBell,
    LuTicket,
    LuUserCheck,
    LuHeadphones,
    LuSave,
} from "react-icons/lu";
import { NotificationSettingResponse, NotificationType } from "@/types";

const NOTIFICATION_GROUPS = [
    {
        title: "Заявки",
        icon: LuTicket,
        types: [
            { type: "TICKET_CREATED" as NotificationType, label: "Создание заявки" },
            { type: "MESSAGE" as NotificationType, label: "Новое сообщение" },
            { type: "STATUS_CHANGE" as NotificationType, label: "Изменение статуса" },
            { type: "ESTIMATED_DATE" as NotificationType, label: "Изменение срока" },
            { type: "RATING" as NotificationType, label: "Оценка заявки" },
        ],
    },
    {
        title: "Назначения",
        icon: LuUserCheck,
        types: [
            { type: "ASSIGNMENT" as NotificationType, label: "Назначение исполнителя" },
            { type: "ASSIGNMENT_ACCEPTED" as NotificationType, label: "Назначение принято" },
            { type: "ASSIGNMENT_REJECTED" as NotificationType, label: "Назначение отклонено" },
            { type: "TICKET_TAKEN" as NotificationType, label: "Заявка взята в работу" },
            { type: "CO_EXECUTOR_ADDED" as NotificationType, label: "Добавлен соисполнитель" },
            { type: "CO_EXECUTOR_REMOVED" as NotificationType, label: "Удалён соисполнитель" },
        ],
    },
    {
        title: "Линии поддержки",
        icon: LuHeadphones,
        types: [
            { type: "SPECIALIST_ADDED_TO_LINE" as NotificationType, label: "Добавлен на линию" },
            { type: "SPECIALIST_REMOVED_FROM_LINE" as NotificationType, label: "Удалён с линии" },
        ],
    },
];

interface NotificationSettingsCardProps {
    settings: NotificationSettingResponse[];
    onSettingsChange: (settings: NotificationSettingResponse[]) => void;
    onSave: () => void;
    isSaving: boolean;
    hasChanges: boolean;
}

export function NotificationSettingsCard({
    settings,
    onSettingsChange,
    onSave,
    isSaving,
    hasChanges,
}: NotificationSettingsCardProps) {
    const handleToggle = (type: NotificationType, channel: "inAppEnabled" | "telegramEnabled") => {
        const updated = settings.map((s) =>
            s.type === type ? { ...s, [channel]: !s[channel] } : s
        );
        onSettingsChange(updated);
    };

    const handleToggleAllColumn = (channel: "inAppEnabled" | "telegramEnabled") => {
        const allEnabled = settings.every((s) => s[channel]);
        const updated = settings.map((s) => ({ ...s, [channel]: !allEnabled }));
        onSettingsChange(updated);
    };

    return (
        <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
            height="100%"
        >
            {/* Card header — same pattern as PersonalInfoCard / TelegramCard */}
            <HStack mb={4}>
                <Icon as={LuBell} color="blue.500" />
                <Heading size="md">Уведомления</Heading>
            </HStack>

            <Text fontSize="sm" color="fg.muted" mb={4}>
                Настройте, какие уведомления вы хотите получать в приложении и в Telegram
            </Text>

            {/* Column headers with master toggles */}
            <HStack
                py={3}
                px={4}
                bg="bg.subtle"
                borderRadius="lg"
                mb={2}
            >
                <Text flex={1} fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
                    Тип уведомления
                </Text>
                <HStack w="100px" justify="center" gap={3}>
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                        InApp
                    </Text>
                    <Switch.Root
                        size="sm"
                        colorPalette="blue"
                        checked={settings.every((s) => s.inAppEnabled)}
                        onCheckedChange={() => handleToggleAllColumn("inAppEnabled")}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                    </Switch.Root>
                </HStack>
                <HStack w="100px" justify="center" gap={2}>
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                        Telegram
                    </Text>
                    <Switch.Root
                        size="sm"
                        colorPalette="blue"
                        checked={settings.every((s) => s.telegramEnabled)}
                        onCheckedChange={() => handleToggleAllColumn("telegramEnabled")}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                    </Switch.Root>
                </HStack>
            </HStack>

            {/* Groups */}
            <VStack gap={0} align="stretch">
                {NOTIFICATION_GROUPS.map((group, groupIndex) => (
                    <Box key={group.title}>
                        {groupIndex > 0 && <Separator my={2} />}
                        <HStack py={2} px={4}>
                            <Icon as={group.icon} color="blue.400" boxSize={4} />
                            <Text fontWeight="medium" fontSize="sm" color="fg.default">
                                {group.title}
                            </Text>
                        </HStack>
                        <VStack gap={0} align="stretch">
                            {group.types.map(({ type, label }) => {
                                const setting = settings.find((s) => s.type === type);
                                if (!setting) return null;
                                return (
                                    <HStack
                                        key={type}
                                        py={2.5}
                                        px={4}
                                        transition="all 0.2s"
                                        _hover={{ bg: "bg.subtle" }}
                                        borderRadius="md"
                                    >
                                        <Text flex={1} fontSize="sm" color="fg.default">
                                            {label}
                                        </Text>
                                        <Box w="100px" display="flex" justifyContent="center">
                                            <Switch.Root
                                                checked={setting.inAppEnabled}
                                                onCheckedChange={() =>
                                                    handleToggle(type, "inAppEnabled")
                                                }
                                            >
                                                <Switch.HiddenInput />
                                                <Switch.Control>
                                                    <Switch.Thumb />
                                                </Switch.Control>
                                            </Switch.Root>
                                        </Box>
                                        <Box w="100px" display="flex" justifyContent="center">
                                            <Switch.Root
                                                checked={setting.telegramEnabled}
                                                onCheckedChange={() =>
                                                    handleToggle(type, "telegramEnabled")
                                                }
                                            >
                                                <Switch.HiddenInput />
                                                <Switch.Control>
                                                    <Switch.Thumb />
                                                </Switch.Control>
                                            </Switch.Root>
                                        </Box>
                                    </HStack>
                                );
                            })}
                        </VStack>
                    </Box>
                ))}
            </VStack>

            {/* Save button — same pattern as PersonalInfoCard */}
            <Button
                colorPalette="blue"
                onClick={onSave}
                loading={isSaving}
                disabled={!hasChanges || isSaving}
                mt={6}
                width="100%"
            >
                <Icon as={LuSave} mr={2} />
                Сохранить изменения
            </Button>
        </Box>
    );
}
