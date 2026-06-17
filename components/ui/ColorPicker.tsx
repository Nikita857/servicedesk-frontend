import { HStack, Box } from "@chakra-ui/react";
import { AVAILABLE_COLORS, RoleColor } from "@/lib/utils/roleColors";

interface ColorPickerProps {
  value: RoleColor | string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <HStack gap={2} flexWrap="wrap">
      {AVAILABLE_COLORS.map((color) => (
        <Box
          key={color}
          bg={`${color}.500`}
          w={6}
          h={6}
          borderRadius="full"
          cursor="pointer"
          outline={value === color ? "2px solid" : "none"}
          outlineColor={value === color ? `${color}.800` : "transparent"}
          outlineOffset="2px"
          onClick={() => onChange(color)}
        />
      ))}
    </HStack>
  );
}
