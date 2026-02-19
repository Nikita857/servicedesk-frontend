"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  IconButton,
} from "@chakra-ui/react";
import {
  LuX,
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
} from "react-icons/lu";
import type { OnboardingControls } from "@/lib/hooks/useOnboarding";

// --- Шаги онбординга ---
export interface OnboardingStep {
  /** Значение атрибута data-onboarding-id на целевом элементе */
  targetId: string;
  title: string;
  description: string;
  placement: "right" | "bottom" | "bottom-end" | "center";
}

export const USER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    targetId: "onboarding-dashboard",
    title: "Дашборд",
    description:
      "Стартовая страница с общей сводкой: ваши активные заявки, последние обновления и быстрые действия — всё на одном экране.",
    placement: "right",
  },
  {
    targetId: "onboarding-tickets",
    title: "Ваши заявки",
    description:
      "Создавайте заявки в техподдержку и отслеживайте их статус. После создания специалист свяжется с вами прямо в чате внутри заявки.",
    placement: "right",
  },
  {
    targetId: "onboarding-wiki",
    title: "База знаний",
    description:
      "Здесь собраны статьи и инструкции по частым вопросам. Может помочь решить проблему без создания заявки.",
    placement: "right",
  },
  {
    targetId: "onboarding-notifications",
    title: "Уведомления",
    description:
      "Здесь появятся оповещения об изменениях статуса ваших заявок, новых сообщениях от специалистов и других событиях.",
    placement: "bottom",
  },
  {
    targetId: "onboarding-profile",
    title: "Профиль и настройки",
    description:
      "Управляйте своим аккаунтом: смените аватар, посмотрите свои данные или выйдите из системы.",
    placement: "bottom-end",
  },
];

export const WIKI_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    targetId: "wiki-fav",
    title: "Кнопка избранное",
    description:
      "Фильтр для статей, которые вы добавили в избранное",
    placement: "bottom",
  },
  {
    targetId: "wiki-switcher",
    title: "Переключатель видимости",
    description:
      "Сортирует сатьи по группам. Если у вас в личном кабинете указан отдел, то вы можете отсортировать стаьи по отделу. Если нет вы видите все статьи",
    placement: "bottom",
  },
  {
    targetId: "wiki-search",
    title: "Поиск",
    description:
      "Полнотекстовый поиск по названию и содержимому статьи. Может давать подсказки при наборе текста",
    placement: "bottom",
  },
  {
    targetId: "wiki-tree",
    title: "Дерево статей",
    description:
      "Иерархическа структура со статьями по категориям",
    placement: "bottom",
  }
]

export const TICKET_FORM_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    targetId: "t-theme",
    title: "Поле ввода темы обращения",
    description:
      "Как бы вы назвали свою проблему?",
    placement: "right",
  },
  {
    targetId: "t-priority",
    title: "Селект приоритета",
    description:
      "Выбирайте приоритет осознанно, если у вас не критичная проблема - не стоит ставить приоритет 'Срочный'",
    placement: "bottom",
  },
  {
    targetId: "t-category",
    title: "Селект категории проблемы",
    description:
      "Выберите категорию проблемы из представленного списка.",
    placement: "bottom",
  },
  {
    targetId: "t-line",
    title: "Селект линии поддержки",
    description:
      "Здесь выбирается кому улетит ваше обращение. При выборе категории - ставится автоматически, но при желании можете изменить свой выбор.",
    placement: "right",
  },
  {
    targetId: "t-description",
    title: "Описание",
    description:
      "Здесь вам нужно будет подробно описать вашу проблему, чтобы специалисты поддержки поняли суть и помогли ее решить.",
    placement: "right",
  }
]

// --- Внутренние константы ---
const CARD_WIDTH = 308;
const CARD_GAP = 14; // расстояние от spotlight до карточки
const SPOT_PADDING = 7; // отступ вокруг целевого элемента

interface SpotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CardPos {
  top: number;
  left: number;
}

// --- Вспомогательная функция вычисления позиции карточки ---
function computeCardPos(
  spot: SpotRect,
  placement: OnboardingStep["placement"],
): CardPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_H = 200; // приблизительная высота карточки

  let top: number;
  let left: number;

  switch (placement) {
    case "right": {
      top = spot.top + spot.height / 2 - CARD_H / 2;
      left = spot.left + spot.width + CARD_GAP;
      break;
    }
    case "bottom": {
      top = spot.top + spot.height + CARD_GAP;
      left = spot.left + spot.width / 2 - CARD_WIDTH / 2;
      break;
    }
    case "bottom-end": {
      top = spot.top + spot.height + CARD_GAP;
      left = spot.left + spot.width - CARD_WIDTH;
      break;
    }
    default: {
      return {
        top: vh / 2 - CARD_H / 2,
        left: vw / 2 - CARD_WIDTH / 2,
      };
    }
  }

  // Ограничиваем позицию краями вьюпорта
  top = Math.max(8, Math.min(top, vh - CARD_H - 8));
  left = Math.max(8, Math.min(left, vw - CARD_WIDTH - 8));

  return { top, left };
}

// --- Главный компонент ---
interface OnboardingOverlayProps {
  steps: OnboardingStep[];
  controls: OnboardingControls;
}

export function OnboardingOverlay({ steps, controls }: OnboardingOverlayProps) {
  const { isActive, currentStep, next, prev, finish } = controls;
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
  const [cardPos, setCardPos] = useState<CardPos | null>(null);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const isCentered = !spotRect || !cardPos;

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      next();
    }
  };

  // Вычисляем позиции при смене шага или ресайзе окна
  useEffect(() => {
    if (!isActive || !step) return;

    const compute = () => {
      // Поддерживаем и data-onboarding-id, и обычный id для совместимости
      const el = document.querySelector<HTMLElement>(
        `[data-onboarding-id="${step.targetId}"], #${step.targetId}`,
      );

      if (!el) {
        setSpotRect(null);
        setCardPos(null);
        return;
      }

      const elRect = el.getBoundingClientRect();

      // Элемент скрыт (например, сайдбар в мобильном drawer)
      if (elRect.width === 0 || elRect.height === 0) {
        setSpotRect(null);
        setCardPos(null);
        return;
      }

      const spot: SpotRect = {
        left: elRect.left - SPOT_PADDING,
        top: elRect.top - SPOT_PADDING,
        width: elRect.width + SPOT_PADDING * 2,
        height: elRect.height + SPOT_PADDING * 2,
      };

      setSpotRect(spot);
      setCardPos(computeCardPos(spot, step.placement));
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isActive, currentStep, step]);

  if (!isActive || !step) return null;

  return (
    <>
      {/* Блокирующий оверлей — поглощает все клики по странице */}
      <Box
        position="fixed"
        inset="0"
        zIndex={9998}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Спотлайт-эффект через огромную box-shadow */}
      {spotRect && (
        <Box
          position="fixed"
          zIndex={9999}
          pointerEvents="none"
          borderRadius="lg"
          transition="left 0.35s ease, top 0.35s ease, width 0.35s ease, height 0.35s ease"
          style={{
            left: spotRect.left,
            top: spotRect.top,
            width: spotRect.width,
            height: spotRect.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.58)",
            border: "2px solid rgba(255,255,255,0.18)",
          }}
        />
      )}

      {/* Затемнение всего экрана когда нет спотлайта (центрированный режим) */}
      {isCentered && (
        <Box
          position="fixed"
          inset="0"
          zIndex={9999}
          bg="blackAlpha.600"
          pointerEvents="none"
        />
      )}

      {/* Карточка с описанием шага */}
      <Box
        position="fixed"
        zIndex={10000}
        w={`${CARD_WIDTH}px`}
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="2xl"
        overflow="hidden"
        transition="top 0.35s ease, left 0.35s ease"
        style={
          isCentered
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            : { top: cardPos!.top, left: cardPos!.left }
        }
      >
        {/* Шапка карточки */}
        <HStack
          bg="bg.subtle"
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border.default"
          justify="space-between"
        >
          <HStack gap={2}>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg="accent.500"
              flexShrink={0}
            />
            <Text fontSize="sm" fontWeight="semibold" color="fg.default">
              {step.title}
            </Text>
          </HStack>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Закрыть обучение"
            onClick={finish}
            color="fg.muted"
            _hover={{ color: "fg.default" }}
          >
            <LuX size={14} />
          </IconButton>
        </HStack>

        {/* Тело карточки */}
        <VStack align="stretch" gap={4} p={4}>
          <Text fontSize="sm" color="fg.default" lineHeight="1.65">
            {step.description}
          </Text>

          {/* Индикатор шагов + навигация */}
          <HStack justify="space-between" align="center">
            {/* Точки-индикаторы */}
            <HStack gap={1.5}>
              {steps.map((_, i) => (
                <Box
                  key={i}
                  h="5px"
                  borderRadius="full"
                  bg={i === currentStep ? "accent.500" : "border.emphasized"}
                  transition="all 0.25s"
                  style={{ width: i === currentStep ? 18 : 5 }}
                />
              ))}
            </HStack>

            {/* Кнопки навигации */}
            <HStack gap={1.5}>
              {!isFirst && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Предыдущий шаг"
                  onClick={prev}
                  color="fg.muted"
                >
                  <LuChevronLeft size={14} />
                </IconButton>
              )}
              <Button
                size="xs"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.700" }}
                onClick={handleNext}
                gap={1}
              >
                {isLast ? (
                  <>
                    <LuCheck size={13} />
                    Готово
                  </>
                ) : (
                  <>
                    Далее
                    <LuChevronRight size={13} />
                  </>
                )}
              </Button>
            </HStack>
          </HStack>
        </VStack>

        {/* Счётчик шагов */}
        <Box
          px={4}
          pb={3}
          mt={-2}
        >
          <Text fontSize="xs" color="fg.subtle">
            Шаг {currentStep + 1} из {steps.length}
          </Text>
        </Box>
      </Box>
    </>
  );
}
