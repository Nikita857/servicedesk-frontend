"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { LuPlus, LuTrash2, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { DataSelect } from "@/components/ui/DataSelect";
import {
  SURVEY_QUESTION_TYPE_LABELS,
  type SurveyElement,
  type SurveyQuestionType,
} from "@/types/survey";

interface SurveyQuestionBuilderProps {
  elements: SurveyElement[];
  onChange: (elements: SurveyElement[]) => void;
}

const typeCollection = createListCollection({
  items: (Object.keys(SURVEY_QUESTION_TYPE_LABELS) as SurveyQuestionType[]).map((type) => ({
    value: type,
    label: SURVEY_QUESTION_TYPE_LABELS[type],
  })),
});

function slugify(title: string, index: number): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `question_${index + 1}`;
}

function hasChoices(type: SurveyQuestionType): boolean {
  return type === "radiogroup" || type === "checkbox";
}

export function SurveyQuestionBuilder({ elements, onChange }: SurveyQuestionBuilderProps) {
  const [nextId, setNextId] = useState(elements.length);

  const updateElement = (index: number, patch: Partial<SurveyElement>) => {
    const updated = elements.map((el, i) => (i === index ? { ...el, ...patch } : el));
    onChange(updated);
  };

  const addElement = () => {
    const title = `Вопрос ${elements.length + 1}`;
    const newElement: SurveyElement = {
      type: "radiogroup",
      name: slugify(title, nextId),
      title,
      isRequired: true,
      choices: [
        { value: "option_1", text: "Вариант 1" },
        { value: "option_2", text: "Вариант 2" },
      ],
    };
    setNextId((n) => n + 1);
    onChange([...elements, newElement]);
  };

  const removeElement = (index: number) => {
    onChange(elements.filter((_, i) => i !== index));
  };

  const moveElement = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= elements.length) return;
    const updated = [...elements];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  };

  const changeType = (index: number, type: SurveyQuestionType) => {
    const el = elements[index];
    updateElement(index, {
      type,
      choices: hasChoices(type) ? (el.choices ?? [{ value: "option_1", text: "Вариант 1" }]) : undefined,
    });
  };

  const addChoice = (index: number) => {
    const el = elements[index];
    const choices = el.choices ?? [];
    const n = choices.length + 1;
    updateElement(index, {
      choices: [...choices, { value: `option_${n}`, text: `Вариант ${n}` }],
    });
  };

  const updateChoice = (index: number, choiceIndex: number, text: string) => {
    const el = elements[index];
    const choices = (el.choices ?? []).map((c, i) => (i === choiceIndex ? { ...c, text } : c));
    updateElement(index, { choices });
  };

  const removeChoice = (index: number, choiceIndex: number) => {
    const el = elements[index];
    const choices = (el.choices ?? []).filter((_, i) => i !== choiceIndex);
    updateElement(index, { choices });
  };

  return (
    <VStack align="stretch" gap={4}>
      {elements.map((el, index) => (
        <Box key={index} bg="bg.subtle" borderRadius="lg" borderWidth="1px" borderColor="border.default" p={4}>
          <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
            <Box flex={1}>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="fg.muted">
                Текст вопроса
              </Text>
              <Input
                value={el.title}
                onChange={(e) => updateElement(index, { title: e.target.value, name: slugify(e.target.value, index) })}
                placeholder="Введите текст вопроса"
                bg="bg.surface"
              />
            </Box>
            <HStack gap={1} pt={5}>
              <IconButton
                aria-label="Переместить вверх"
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => moveElement(index, -1)}
              >
                <LuChevronUp />
              </IconButton>
              <IconButton
                aria-label="Переместить вниз"
                size="sm"
                variant="ghost"
                disabled={index === elements.length - 1}
                onClick={() => moveElement(index, 1)}
              >
                <LuChevronDown />
              </IconButton>
              <IconButton
                aria-label="Удалить вопрос"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => removeElement(index)}
              >
                <LuTrash2 />
              </IconButton>
            </HStack>
          </Flex>

          <HStack gap={4} align="flex-end" mb={3}>
            <DataSelect
              collection={typeCollection}
              value={[el.type]}
              onValueChange={(d) => changeType(index, d.value[0] as SurveyQuestionType)}
              label="Тип вопроса"
              width="260px"
              size="sm"
            />
            <Button
              size="sm"
              variant={el.isRequired ? "solid" : "outline"}
              onClick={() => updateElement(index, { isRequired: !el.isRequired })}
            >
              {el.isRequired ? "Обязательный" : "Необязательный"}
            </Button>
          </HStack>

          {hasChoices(el.type) && (
            <Box>
              <Text mb={2} fontSize="xs" fontWeight="medium" color="fg.muted">
                Варианты ответа
              </Text>
              <VStack align="stretch" gap={2}>
                {(el.choices ?? []).map((choice, choiceIndex) => (
                  <HStack key={choiceIndex} gap={2}>
                    <Input
                      value={choice.text}
                      onChange={(e) => updateChoice(index, choiceIndex, e.target.value)}
                      placeholder={`Вариант ${choiceIndex + 1}`}
                      bg="bg.surface"
                      size="sm"
                    />
                    <IconButton
                      aria-label="Удалить вариант"
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      disabled={(el.choices ?? []).length <= 2}
                      onClick={() => removeChoice(index, choiceIndex)}
                    >
                      <LuTrash2 />
                    </IconButton>
                  </HStack>
                ))}
              </VStack>
              <Button size="xs" variant="ghost" mt={2} onClick={() => addChoice(index)}>
                <LuPlus /> Добавить вариант
              </Button>
            </Box>
          )}
        </Box>
      ))}

      <Button variant="outline" onClick={addElement} alignSelf="flex-start">
        <LuPlus /> Добавить вопрос
      </Button>
    </VStack>
  );
}
