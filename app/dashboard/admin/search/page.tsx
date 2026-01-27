"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { LuSearch, LuBook, LuTicket, LuRefreshCw } from "react-icons/lu";
import { searchAdminApi } from "@/lib/api/search";
import { toast } from "@/lib/utils";

export default function SearchAdminPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleReindex = async (type: "all" | "wiki" | "tickets") => {
    setLoading(type);
    try {
      if (type === "all") {
        await searchAdminApi.reindexAll();
      } else if (type === "wiki") {
        await searchAdminApi.reindexWiki();
      } else if (type === "tickets") {
        await searchAdminApi.reindexTickets();
      }
      toast.success(
        "Переиндексация запущена",
        "Процесс запущен в фоновом режиме. Это может занять некоторое время.",
      );
    } catch (error) {
      toast.error("Ошибка", "Не удалось запустить переиндексацию");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="start" gap={8}>
        <Box>
          <Heading size="lg" mb={2}>
            Управление поиском (Elasticsearch)
          </Heading>
          <Text color="fg.muted">
            Здесь вы можете управлять поисковыми индексами. Переиндексация
            обновляет данные в Elasticsearch на основе текущего состояния базы
            данных.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full">
          {/* All Indices */}
          <Card.Root variant="outline">
            <Card.Header>
              <Stack direction="row" align="center" gap={3}>
                <Icon as={LuSearch} boxSize={6} color="accent.600" />
                <Heading size="md">Все индексы</Heading>
              </Stack>
            </Card.Header>
            <Card.Body>
              <Text fontSize="sm" color="fg.muted">
                Полная переиндексация всех сущностей в системе. Рекомендуется
                при масштабных изменениях или сбоях в поиске.
              </Text>
            </Card.Body>
            <Card.Footer>
              <Button
                w="full"
                colorPalette="blue"
                loading={loading === "all"}
                onClick={() => handleReindex("all")}
              >
                <Icon as={LuRefreshCw} />
                Переиндексировать всё
              </Button>
            </Card.Footer>
          </Card.Root>

          {/* Wiki Index */}
          <Card.Root variant="outline">
            <Card.Header>
              <Stack direction="row" align="center" gap={3}>
                <Icon as={LuBook} boxSize={6} color="green.600" />
                <Heading size="md">База знаний (Wiki)</Heading>
              </Stack>
            </Card.Header>
            <Card.Body>
              <Text fontSize="sm" color="fg.muted">
                Обновление индекса статей Wiki. Используйте, если новые статьи
                не появляются в поиске или отображаются некорректно.
              </Text>
            </Card.Body>
            <Card.Footer>
              <Button
                w="full"
                variant="outline"
                loading={loading === "wiki"}
                onClick={() => handleReindex("wiki")}
              >
                <Icon as={LuRefreshCw} />
                Обновить Wiki
              </Button>
            </Card.Footer>
          </Card.Root>

          {/* Tickets Index */}
          <Card.Root variant="outline">
            <Card.Header>
              <Stack direction="row" align="center" gap={3}>
                <Icon as={LuTicket} boxSize={6} color="orange.600" />
                <Heading size="md">Тикеты</Heading>
              </Stack>
            </Card.Header>
            <Card.Body>
              <Text fontSize="sm" color="fg.muted">
                Обновление индекса заявок. Позволяет актуализировать поиск по
                содержимому тикетов и комментариям.
              </Text>
            </Card.Body>
            <Card.Footer>
              <Button
                w="full"
                variant="outline"
                loading={loading === "tickets"}
                onClick={() => handleReindex("tickets")}
              >
                <Icon as={LuRefreshCw} />
                Обновить Тикеты
              </Button>
            </Card.Footer>
          </Card.Root>
        </SimpleGrid>

        <Box
          p={4}
          bg="bg.subtle"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="border.default"
          w="full"
        >
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Примечание:
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Процесс переиндексации выполняется асинхронно на сервере. Во время
            работы процесса поиск может временно возвращать неполные результаты.
            Нагрузка на сервер может кратковременно возрасти.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
