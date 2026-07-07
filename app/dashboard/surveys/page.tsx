"use client";

import { Box, Flex, Heading, Text, VStack, HStack, Badge, Spinner } from "@chakra-ui/react";
import { LuClipboardList } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useMySurveysQuery } from "@/lib/hooks/surveys";
import type { MySurveyResponse } from "@/types/survey";

export default function MySurveysPage() {
  const { data: surveys, isLoading } = useMySurveysQuery();
  const router = useRouter();

  return (
    <Box maxW="720px" mx="auto">
      <Heading size="lg" color="fg.default" mb={6}>
        Мои опросы
      </Heading>

      {isLoading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" />
        </Flex>
      ) : !surveys || surveys.length === 0 ? (
        <Flex direction="column" align="center" py={16} gap={3}>
          <LuClipboardList size={32} color="var(--chakra-colors-fg-subtle)" />
          <Text color="fg.muted">У вас пока нет опросов</Text>
        </Flex>
      ) : (
        <VStack align="stretch" gap={3}>
          {surveys.map((survey) => (
            <SurveyListItem key={survey.id} survey={survey} onClick={() => router.push(`/dashboard/surveys/${survey.id}`)} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function SurveyListItem({ survey, onClick }: { survey: MySurveyResponse; onClick: () => void }) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={5}
      cursor="pointer"
      _hover={{ borderColor: "accent.500" }}
      transition="border-color 0.15s"
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex={1}>
          <Text fontWeight="semibold" color="fg.default" mb={1}>
            {survey.title}
          </Text>
          {survey.description && (
            <Text fontSize="sm" color="fg.muted" lineClamp={2}>
              {survey.description}
            </Text>
          )}
        </Box>
        <HStack gap={2} flexShrink={0}>
          {survey.responded ? (
            <Badge colorPalette="green">Отвечено</Badge>
          ) : survey.expired ? (
            <Badge colorPalette="gray">Закрыт</Badge>
          ) : (
            <Badge colorPalette="blue">Ожидает ответа</Badge>
          )}
        </HStack>
      </Flex>
      <Text fontSize="xs" color="fg.subtle" mt={3}>
        До {new Date(survey.endDate).toLocaleString("ru-RU")}
      </Text>
    </Box>
  );
}
