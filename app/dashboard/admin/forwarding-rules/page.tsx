"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Button,
  HStack,
  Badge,
  Table,
  Checkbox,
} from "@chakra-ui/react";
import { LuSave, LuUndo2 } from "react-icons/lu";
import { useForwardingRules } from "@/lib/hooks/admin-forwarding-rules";
import { userRolesBadges } from "@/types/auth";

const roleLabel = (role: string): string =>
  userRolesBadges[role]?.name || role;

const roleColor = (role: string): string =>
  userRolesBadges[role]?.color || "gray";

export default function ForwardingRulesPage() {
  const {
    matrix,
    isLoading,
    isDirty,
    isSaving,
    toggleRule,
    save,
    reset,
    SOURCE_ROLES,
    TARGET_ROLES,
  } = useForwardingRules();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Правила маршрутизации
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Настройка разрешённых направлений переадресации тикетов между ролями.
            Администратор всегда может переадресовать на любую линию.
          </Text>
        </Box>

        <HStack gap={2}>
          {isDirty && (
            <Button variant="outline" onClick={reset}>
              <LuUndo2 />
              Сбросить
            </Button>
          )}
          <Button
            bg="gray.900"
            color="white"
            _hover={{ bg: "gray.800" }}
            onClick={save}
            loading={isSaving}
            disabled={!isDirty}
          >
            <LuSave />
            Сохранить
          </Button>
        </HStack>
      </Flex>

      {/* Matrix */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={6}
        overflowX="auto"
      >
        <Text fontSize="sm" color="fg.muted" mb={4}>
          Строки — роль пользователя, выполняющего переадресацию. Столбцы — роль
          целевой линии.
        </Text>

        <Table.Root variant="outline" size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                minW="160px"
                bg="bg.subtle"
                fontWeight="bold"
              >
                Откуда ↓ / Куда →
              </Table.ColumnHeader>
              {TARGET_ROLES.map((role) => (
                <Table.ColumnHeader key={role} textAlign="center" bg="bg.subtle">
                  <Badge colorPalette={roleColor(role)} variant="subtle">
                    {roleLabel(role)}
                  </Badge>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {SOURCE_ROLES.map((srcRole) => (
              <Table.Row key={srcRole}>
                <Table.Cell fontWeight="medium">
                  <Badge colorPalette={roleColor(srcRole)} variant="subtle">
                    {roleLabel(srcRole)}
                  </Badge>
                </Table.Cell>
                {TARGET_ROLES.map((tgtRole) => (
                  <Table.Cell key={tgtRole} textAlign="center">
                    <Flex justify="center">
                      <Checkbox.Root
                        checked={matrix[srcRole]?.[tgtRole] ?? false}
                        onCheckedChange={() => toggleRule(srcRole, tgtRole)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Flex>
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}

            {/* Admin row — всегда включён, неизменяемый */}
            <Table.Row>
              <Table.Cell fontWeight="medium">
                <Badge colorPalette="red" variant="subtle">
                  Администратор
                </Badge>
              </Table.Cell>
              {TARGET_ROLES.map((tgtRole) => (
                <Table.Cell key={tgtRole} textAlign="center">
                  <Flex justify="center">
                    <Checkbox.Root checked disabled>
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Flex>
                </Table.Cell>
              ))}
            </Table.Row>
          </Table.Body>
        </Table.Root>

        <Text fontSize="xs" color="fg.muted" mt={4}>
          Изменения вступают в силу после сохранения. Кэш обновляется
          автоматически.
        </Text>
      </Box>
    </Box>
  );
}
