import { Button, Flex, Heading, HStack, IconButton } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight, LuPlus } from "react-icons/lu";

interface IProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
}

export default function CalendarHeader({
  month,
  onPrev,
  onNext,
  onToday,
  onCreate,
}: IProps) {
  const raw = month.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const title = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <Flex
      justify="space-between"
      align="center"
      mb={4}
      gap={2}
      wrap="wrap"
    >
      <HStack gap={2} flexWrap="wrap">
        <IconButton
          variant="outline"
          size="sm"
          onClick={onPrev}
          aria-label="Предыдущий месяц"
        >
          <LuChevronLeft />
        </IconButton>

        <Heading
          size={{ base: "sm", md: "md" }}
          minW={{ base: "120px", md: "200px" }}
          textAlign="center"
        >
          {title}
        </Heading>

        <IconButton
          variant="outline"
          size="sm"
          onClick={onNext}
          aria-label="Следующий месяц"
        >
          <LuChevronRight />
        </IconButton>

        <Button size="sm" variant="outline" onClick={onToday}>
          Сегодня
        </Button>
      </HStack>

      <Button
        size="sm"
        bg="gray.900"
        color="white"
        _hover={{ bg: "gray.800" }}
        onClick={onCreate}
      >
        <LuPlus /> Создать
      </Button>
    </Flex>
  );
}
