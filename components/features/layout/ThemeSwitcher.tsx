"use client";

import { useColorMode } from "@/components/ui/color-mode";
import { IconButton } from "@chakra-ui/react";
import { LuSun, LuMoon } from "react-icons/lu";

export function ThemeSwitcher() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle theme"
      onClick={toggleColorMode}
      variant="ghost"
      color="fg.muted"
      _hover={{ bg: "bg.subtle", color: "fg.default" }}
    >
      {colorMode === "dark" ? <LuSun /> : <LuMoon /> }
    </IconButton>
  );
}
