"use client"

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import { ChakraProvider } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import { Toaster } from "./toaster"

// Black & White theme - clean, minimal, professional
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Grayscale only
        gray: {
          50: { value: "#fafafa" },
          100: { value: "#f5f5f5" },
          200: { value: "#e5e5e5" },
          300: { value: "#d4d4d4" },
          400: { value: "#a3a3a3" },
          500: { value: "#737373" },
          600: { value: "#525252" },
          700: { value: "#404040" },
          800: { value: "#262626" },
          900: { value: "#171717" },
          950: { value: "#0a0a0a" },
        },
        // Accent is also grayscale
        accent: {
          50: { value: "#fafafa" },
          100: { value: "#f5f5f5" },
          200: { value: "#e5e5e5" },
          300: { value: "#d4d4d4" },
          400: { value: "#a3a3a3" },
          500: { value: "#737373" },
          600: { value: "#525252" },
          700: { value: "#404040" },
          800: { value: "#262626" },
          900: { value: "#171717" },
        },
        // Keep functional colors muted
        success: {
          500: { value: "#16a34a" },
          600: { value: "#15803d" },
        },
        warning: {
          500: { value: "#ca8a04" },
          600: { value: "#a16207" },
        },
        error: {
          500: { value: "#dc2626" },
          600: { value: "#b91c1c" },
        }
      },
    },
    semanticTokens: {
      colors: {
        // Background colors
        "bg.canvas": {
          value: { _light: "#fafafa", _dark: "#0a0a0a" },
        },
        "bg.surface": {
          value: { _light: "#ffffff", _dark: "#171717" },
        },
        "bg.subtle": {
          value: { _light: "#f5f5f5", _dark: "#262626" },
        },
        "bg.muted": {
          value: { _light: "#e5e5e5", _dark: "#404040" },
        },
        // Text colors
        "fg.default": {
          value: { _light: "#171717", _dark: "#fafafa" },
        },
        "fg.muted": {
          value: { _light: "#525252", _dark: "#a3a3a3" },
        },
        "fg.subtle": {
          value: { _light: "#737373", _dark: "#737373" },
        },
        // Border colors
        "border.default": {
          value: { _light: "#e5e5e5", _dark: "#262626" },
        },
        "border.muted": {
          value: { _light: "#f5f5f5", _dark: "#171717" },
        },
      },
    },
  },
})

const system = createSystem(defaultConfig, config)

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
      <Toaster />
    </ChakraProvider>
  )
}
