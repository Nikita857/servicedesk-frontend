"use client";

import { use } from "react";
import { Box, Flex, Heading, Text, Spinner, Badge, HStack } from "@chakra-ui/react";
import { LuCircleCheck, LuClock } from "react-icons/lu";
import { BackButton } from "@/components/ui";
import { SurveyRunner } from "@/components/features/survey";
import { useSurveyQuery, useSubmitSurveyResponses } from "@/lib/hooks/surveys";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyPage({ params }: PageProps) {
  const { id } = use(params);
  const surveyId = Number(id);

  const { data: survey, isLoading } = useSurveyQuery(surveyId);
  const submitMutation = useSubmitSurveyResponses(surveyId);

  if (isLoading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!survey) {
    return null;
  }

  const isDone = survey.alreadyAnswered;

  return (
    <Box maxW="720px" mx="auto">
      <BackButton href="/dashboard/surveys" label="К списку опросов" mb={4} />

      <Box bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default" p={8}>
        <HStack mb={2} gap={2}>
          {survey.anonymous && <Badge colorPalette="gray">Анонимный</Badge>}
        </HStack>
        <Heading size="lg" color="fg.default" mb={2}>
          {survey.title}
        </Heading>
        {survey.description && (
          <Text color="fg.muted" mb={6}>
            {survey.description}
          </Text>
        )}

        {isDone ? (
          <Flex direction="column" align="center" py={10} gap={3}>
            <LuCircleCheck size={40} color="var(--chakra-colors-green-500)" />
            <Text fontWeight="medium" color="fg.default">
              Вы уже ответили на этот опрос
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Спасибо за уделённое время
            </Text>
          </Flex>
        ) : (
          <SurveyRunner
            questions={survey.questions}
            onComplete={(data) => submitMutation.mutate({ data })}
          />
        )}

        <HStack mt={6} gap={2} color="fg.subtle" fontSize="xs">
          <LuClock size={14} />
          <Text>Опрос доступен до {new Date(survey.endDate).toLocaleString("ru-RU")}</Text>
        </HStack>
      </Box>
    </Box>
  );
}
