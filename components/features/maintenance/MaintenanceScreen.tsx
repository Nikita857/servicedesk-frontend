"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Separator,
} from "@chakra-ui/react";
import { LuWrench } from "react-icons/lu";

interface IProps {
  /** Ожидаемое время завершения работ (ISO-8601). null — счётчик не показывается. */
  endsAt: string | null;
  /** Кастомное сообщение от админа. Если пусто — дефолтный текст. */
  message?: string | null;
}

const DEFAULT_MESSAGE = "Мы обновляем систему. Веб сервис временно недоступен.";

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <VStack gap={1}>
      <Box
        bg="bg.subtle"
        border="1px solid"
        borderColor="border.default"
        borderRadius="lg"
        px={5}
        py={3}
        minW="72px"
        textAlign="center"
      >
        <Text
          fontSize="3xl"
          fontWeight="bold"
          color="fg.default"
          letterSpacing="-0.03em"
          fontVariantNumeric="tabular-nums"
        >
          {String(value).padStart(2, "0")}
        </Text>
      </Box>
      <Text fontSize="xs" color="fg.subtle" fontWeight="medium">
        {label}
      </Text>
    </VStack>
  );
}

function Colon() {
  return (
    <Text
      fontSize="2xl"
      fontWeight="bold"
      color="fg.muted"
      mb={5}
      userSelect="none"
    >
      :
    </Text>
  );
}

export default function MaintenanceScreen({ endsAt, message }: IProps) {
  // Цель отсчёта в ms. NaN — если endsAt не задан или невалиден → счётчик скрыт.
  const endTime = endsAt ? Date.parse(endsAt) : NaN;
  const hasCountdown = !Number.isNaN(endTime);

  const [timeLeft, setTimeLeft] = useState(() =>
    hasCountdown ? endTime - Date.now() : 0,
  );
  const reloadScheduled = useRef(false);

  useEffect(() => {
    if (!hasCountdown) return;

    const interval = setInterval(() => {
      const remaining = endTime - Date.now();
      setTimeLeft(remaining);

      if (remaining <= 0 && !reloadScheduled.current) {
        reloadScheduled.current = true;
        setTimeout(() => window.location.reload(), 3000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, hasCountdown]);

  const isFinished = timeLeft <= 0;
  const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <Box
      minH="100vh"
      bg="bg.canvas"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        maxW="480px"
        w="full"
        bg="bg.surface"
        border="1px solid"
        borderColor="border.default"
        borderRadius="2xl"
        p={10}
        boxShadow="sm"
      >
        <VStack gap={7} textAlign="center">
          <Box
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.default"
            borderRadius="xl"
            p={4}
            color="fg.muted"
          >
            <LuWrench size={28} />
          </Box>

          <VStack gap={2}>
            <Heading
              size="xl"
              color="fg.default"
              fontWeight="semibold"
              letterSpacing="-0.02em"
            >
              Технические работы
            </Heading>
            <Text color="fg.muted" fontSize="sm" maxW="340px">
              {message?.trim() ? message : DEFAULT_MESSAGE}
            </Text>
          </VStack>

          {hasCountdown && (
            <>
              <Separator borderColor="border.default" />

              <VStack gap={4}>
                <Text
                  fontSize="xs"
                  color="fg.subtle"
                  fontWeight="medium"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  Ожидаемое время завершения
                </Text>

                {isFinished ? (
                  <Text fontSize="md" color="fg.muted" fontWeight="medium">
                    Завершаем последние проверки…
                  </Text>
                ) : (
                  <HStack gap={2} align="flex-end">
                    <TimeBlock value={hours} label="часов" />
                    <Colon />
                    <TimeBlock value={minutes} label="минут" />
                    <Colon />
                    <TimeBlock value={seconds} label="секунд" />
                  </HStack>
                )}
              </VStack>
            </>
          )}

          <Separator borderColor="border.default" />

          <Text fontSize="xs" color="fg.subtle">
            Страница обновится автоматически по окончании работ
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
