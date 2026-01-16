"use client";

import {
  Select,
  Portal,
  createListCollection,
  ListCollection,
  Text,
} from "@chakra-ui/react";
import { ReactNode } from "react";

interface DataSelectProps<T> {
  collection: ListCollection<T>;
  value?: string[];
  onValueChange?: (details: { value: string[] }) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  helperText?: ReactNode;
  width?: string | number;
  size?: "sm" | "md" | "lg";
  renderItem?: (item: T) => ReactNode;
  portalled?: boolean;
}

export function DataSelect<T extends { label: string; value: string }>({
  collection,
  value,
  onValueChange,
  placeholder = "Выберите...",
  label,
  disabled = false,
  helperText,
  width = "100%",
  size = "md",
  renderItem,
  portalled = true,
}: DataSelectProps<T>) {
  const content = (
    <Select.Content>
      {collection.items.map((item) => (
        <Select.Item key={item.value} item={item}>
          {renderItem ? renderItem(item) : item.label}
        </Select.Item>
      ))}
    </Select.Content>
  );

  return (
    <Select.Root
      collection={collection}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      size={size}
      width={width}
    >
      {label && <Select.Label mb={1}>{label}</Select.Label>}
      <Select.Trigger>
        <Select.ValueText placeholder={placeholder} />
      </Select.Trigger>
      {portalled ? (
        <Portal>
          <Select.Positioner>{content}</Select.Positioner>
        </Portal>
      ) : (
        <Select.Positioner>{content}</Select.Positioner>
      )}
      {helperText && (
        <Text mt={1} fontSize="xs" color="fg.muted">
          {helperText}
        </Text>
      )}
    </Select.Root>
  );
}
