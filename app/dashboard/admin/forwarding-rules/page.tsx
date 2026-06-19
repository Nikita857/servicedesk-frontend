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
import { getSpecialistTypeInfo } from "@/types/auth";

export default function ForwardingRulesPage() {
  const {
    matrix,
    specialistTypes,
    isLoading,
    isDirty,
    isSaving,
    toggleRule,
    save,
    reset,
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
            Настройка разрешённых направлений переадресации тикетов между типами
            специалистов. Администратор всегда может переадресовать на любую линию.
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
          Строки — тип специалиста, выполняющего переадресацию. Столбцы — тип
          специалистов целевой линии.
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
              {specialistTypes.map((type) => (
                <Table.ColumnHeader key={type.code} textAlign="center" bg="bg.subtle">
                  <Badge colorPalette={getSpecialistTypeInfo(type.code).color} variant="subtle">
                    {type.name}
                  </Badge>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {specialistTypes.map((srcType) => (
              <Table.Row key={srcType.code}>
                <Table.Cell fontWeight="medium">
                  <Badge colorPalette={getSpecialistTypeInfo(srcType.code).color} variant="subtle">
                    {srcType.name}
                  </Badge>
                </Table.Cell>
                {specialistTypes.map((tgtType) => (
                  <Table.Cell key={tgtType.code} textAlign="center">
                    <Flex justify="center">
                      <Checkbox.Root
                        checked={matrix[srcType.code]?.[tgtType.code] ?? false}
                        onCheckedChange={() => toggleRule(srcType.code, tgtType.code)}
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
              {specialistTypes.map((type) => (
                <Table.Cell key={type.code} textAlign="center">
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
