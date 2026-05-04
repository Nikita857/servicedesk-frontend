"use client";

import { DayOfWeek } from "@/types/scheduler";
import { Checkbox, HStack, Text } from "@chakra-ui/react";

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Пн" },
  { value: "TUESDAY", label: "Вт" },
  { value: "WEDNESDAY", label: "Ср" },
  { value: "THURSDAY", label: "Чт" },
  { value: "FRIDAY", label: "Пт" },
  { value: "SATURDAY", label: "Сб" },
  { value: "SUNDAY", label: "Вс" },
];

interface IProps {
  value: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  disabled?: boolean;
}

export default function DaysOfWeekSelect({ value, onChange, disabled }: IProps) {
  const toggle = (day: DayOfWeek) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <HStack gap={2} flexWrap="wrap">
      {DAYS.map(({ value: day, label }) => (
        <Checkbox.Root
          key={day}
          checked={value.includes(day)}
          onCheckedChange={() => toggle(day)}
          disabled={disabled}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Text fontSize="sm">{label}</Text>
        </Checkbox.Root>
      ))}
    </HStack>
  );
}
