"use client";

import { Box, Text, createListCollection } from "@chakra-ui/react";
import { DataSelect } from "@/components/ui";
import DaysOfWeekSelect from "./DaysOfWeekSelect";
import type { DayOfWeek, RecurrenceType } from "@/types/scheduler";

const recurrenceCollection = createListCollection({
  items: [
    { label: "Без повторения", value: "NONE" },
    { label: "Ежедневно", value: "DAILY" },
    { label: "Еженедельно (по дням)", value: "WEEKLY" },
    { label: "Ежемесячно", value: "MONTHLY" },
  ],
});

interface IProps {
  recurrenceType: RecurrenceType;
  recurrenceDaysOfWeek: DayOfWeek[];
  recurrenceUntil?: string;
  onChange: (patch: {
    recurrenceType?: RecurrenceType;
    recurrenceDaysOfWeek?: DayOfWeek[];
    recurrenceUntil?: string;
  }) => void;
  disabled?: boolean;
}

export default function RecurrenceFields({
  recurrenceType,
  recurrenceDaysOfWeek,
  recurrenceUntil,
  onChange,
  disabled,
}: IProps) {
  const handleTypeChange = (type: RecurrenceType) => {
    // При смене типа сбрасываем зависимые поля
    if (type === "NONE") {
      onChange({ recurrenceType: type, recurrenceDaysOfWeek: [], recurrenceUntil: undefined });
    } else if (type !== "WEEKLY") {
      onChange({ recurrenceType: type, recurrenceDaysOfWeek: [] });
    } else {
      onChange({ recurrenceType: type });
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <DataSelect
        label="Повторение"
        collection={recurrenceCollection}
        value={[recurrenceType]}
        onValueChange={(e) => handleTypeChange(e.value[0] as RecurrenceType)}
        disabled={disabled}
        portalled={false}
      />

      {recurrenceType === "WEEKLY" && (
        <Box>
          <Text mb={2} fontSize="sm" fontWeight="medium" color="fg.default">
            Дни недели
          </Text>
          <DaysOfWeekSelect
            value={recurrenceDaysOfWeek}
            onChange={(days) => onChange({ recurrenceDaysOfWeek: days })}
            disabled={disabled}
          />
        </Box>
      )}

      {recurrenceType !== "NONE" && (
        <Box>
          <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
            Повторять до (опционально)
          </Text>
          <input
            type="datetime-local"
            value={recurrenceUntil ? toLocalDateTimeString(recurrenceUntil) : ""}
            onChange={(e) =>
              onChange({
                recurrenceUntil: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
            disabled={disabled}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--chakra-colors-border-default)",
              background: "var(--chakra-colors-bg-subtle)",
              fontSize: "14px",
              color: "var(--chakra-colors-fg-default)",
            }}
          />
        </Box>
      )}
    </Box>
  );
}

function toLocalDateTimeString(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
