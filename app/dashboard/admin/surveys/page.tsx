"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { LuPlus, LuLock, LuTrash2 } from "react-icons/lu";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { useSurveysQuery, useCloseSurvey, useDeleteSurvey } from "@/lib/hooks/surveys";
import { SDPagination } from "@/components/ui/SDPagination";
import type { SurveyManagementResponse } from "@/types/survey";

export default function AdminSurveysPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();
  const [page, setPage] = useState(0);

  const surveysQuery = useSurveysQuery(page, 20);
  const closeMutation = useCloseSurvey();
  const deleteMutation = useDeleteSurvey();

  useEffect(() => {
    if (isHydrated && !has(PERM.SURVEY_MANAGE)) {
      router.push("/dashboard");
    }
  }, [isHydrated, has, router]);

  if (!isHydrated || !has(PERM.SURVEY_MANAGE)) return null;

  const surveys = surveysQuery.data?.content ?? [];
  const pageInfo = surveysQuery.data?.page;

  return (
    <Box maxW="900px" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="fg.default">
          Опросы
        </Heading>
        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={() => router.push("/dashboard/admin/surveys/new")}
        >
          <LuPlus /> Создать опрос
        </Button>
      </Flex>

      {surveysQuery.isLoading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" />
        </Flex>
      ) : surveys.length === 0 ? (
        <Text color="fg.muted" textAlign="center" py={16}>
          Опросов пока нет
        </Text>
      ) : (
        <VStack align="stretch" gap={3}>
          {surveys.map((survey) => (
            <SurveyRow
              key={survey.id}
              survey={survey}
              onClose={() => closeMutation.mutate(survey.id)}
              onDelete={() => deleteMutation.mutate(survey.id)}
            />
          ))}
        </VStack>
      )}

      {pageInfo && pageInfo.totalPages > 1 && (
        <Box mt={4}>
          <SDPagination page={pageInfo} action={setPage} size="sm" />
        </Box>
      )}
    </Box>
  );
}

function SurveyRow({
  survey,
  onClose,
  onDelete,
}: {
  survey: SurveyManagementResponse;
  onClose: () => void;
  onDelete: () => void;
}) {
  const isClosed = survey.closedAt !== null || new Date(survey.endDate) < new Date();
  const targets = [...survey.targetDepartmentNames, ...survey.targetUserNames];

  return (
    <Box bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default" p={5}>
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex={1} minW={0}>
          <HStack gap={2} mb={1}>
            <Text fontWeight="semibold" color="fg.default">
              {survey.title}
            </Text>
            {survey.anonymous && <Badge colorPalette="gray">Анонимный</Badge>}
            {isClosed && <Badge colorPalette="gray">Закрыт</Badge>}
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            {survey.questionCount} вопрос(ов) · {survey.totalResponded} из {survey.totalRecipients} ответили
          </Text>
          {targets.length > 0 && (
            <Text fontSize="xs" color="fg.subtle" mt={1} lineClamp={1}>
              Кому: {targets.join(", ")}
            </Text>
          )}
          <Text fontSize="xs" color="fg.subtle" mt={1}>
            До {new Date(survey.endDate).toLocaleString("ru-RU")}
          </Text>
        </Box>
        <HStack gap={1} flexShrink={0}>
          {!isClosed && (
            <Button size="xs" variant="outline" onClick={onClose}>
              <LuLock /> Закрыть
            </Button>
          )}
          <Button size="xs" variant="outline" colorPalette="red" onClick={onDelete}>
            <LuTrash2 /> Удалить
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
