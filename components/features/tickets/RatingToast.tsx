"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  VStack,
  HStack,
  RatingGroup,
} from "@chakra-ui/react";
import { LuX, LuSend, LuStar } from "react-icons/lu";
import { ticketApi } from "@/lib/api/tickets";
import { toast } from "@/lib/utils";

interface RatingToastProps {
  ticketId: number;
  onClose: () => void;
}

/**
 * Persistent toast for rating a closed ticket
 * Shows interactive stars with hover effect
 */
export function RatingToast({ ticketId, onClose }: RatingToastProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Выберите оценку", "Пожалуйста, выберите количество звёзд");
      return;
    }

    setIsSubmitting(true);
    try {
      await ticketApi.rateTicket(ticketId, {
        rating,
        feedback: feedback.trim() || undefined,
      });
      toast.success(
        "Спасибо за отзыв!",
        "Ваша оценка помогает нам улучшать качество обслуживания"
      );
      onClose();
    } catch (error) {
      toast.error("Ошибка", "Не удалось отправить оценку");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      bg="white"
      _dark={{ bg: "gray.800", borderColor: "gray.700" }}
      borderRadius="xl"
      boxShadow="xl"
      borderWidth="1px"
      borderColor="gray.200"
      p={5}
      minW="320px"
      maxW="400px"
      zIndex={1000}
    >
      {/* Close button */}
      <Button
        position="absolute"
        top={2}
        right={2}
        size="xs"
        variant="ghost"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <LuX />
      </Button>

      <VStack gap={4} align="stretch">
        {/* Header */}
        <Box>
          <Text fontWeight="semibold" fontSize="lg" color="fg.default">
            Оцените обслуживание
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Как вы оцениваете качество решения вашей проблемы?
          </Text>
        </Box>

        {/* Stars */}
        <HStack justify="center" gap={1}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Box
              key={star}
              as="button"
              cursor="pointer"
              p={1}
              borderRadius="md"
              transition="all 0.15s"
              _hover={{ transform: "scale(1.1)" }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              <LuStar
                size={32}
                fill={star <= displayRating ? "#F6E05E" : "transparent"}
                color={star <= displayRating ? "#D69E2E" : "#CBD5E0"}
                style={{ transition: "all 0.15s" }}
              />
            </Box>
          ))}
        </HStack>

        {/* Rating label - always render with fixed height to prevent jitter */}
        <Text
          textAlign="center"
          fontSize="sm"
          color="fg.muted"
          minH="20px"
          visibility={displayRating > 0 ? "visible" : "hidden"}
        >
          {displayRating > 0 ? getRatingLabel(displayRating) : "\u00A0"}
        </Text>

        {/* Feedback */}
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Оставьте комментарий (необязательно)"
          size="sm"
          rows={3}
        />

        {/* Submit button */}
        <Button
          colorPalette="yellow"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={rating === 0}
        >
          <LuSend />
          Отправить оценку
        </Button>
      </VStack>
    </Box>
  );
}

function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: "Очень плохо",
    2: "Плохо",
    3: "Нормально",
    4: "Хорошо",
    5: "Отлично!",
  };
  return labels[rating] || "";
}
