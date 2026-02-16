'use client'

import {
  Box,
  HStack,
  Text,
  Collapsible,
  VStack,
  IconButton,
  Popover,
  Portal,
  Input,
} from "@chakra-ui/react"
import {
  LuChevronRight,
  LuChevronDown,
  LuFolder,
  LuFolderOpen,
  LuFile,
  LuChevronDown as LuSelectArrow,
  LuX,
} from "react-icons/lu"
import { useState, useMemo, useRef, useEffect } from "react"
import type { WikiCategoryTree } from "@/lib/api/wiki"

// --- Один узел дерева в выпадающем списке ---
interface SelectTreeItemProps {
  node: WikiCategoryTree
  depth: number
  selectedId: number | undefined
  onSelect: (node: WikiCategoryTree) => void
  searchTerm: string
}

const SelectTreeItem = ({ node, depth, selectedId, onSelect, searchTerm }: SelectTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.id === selectedId

  // Auto-expand when searching and children match
  useEffect(() => {
    if (searchTerm && hasChildren) {
      const hasMatchInChildren = (nodes: WikiCategoryTree[]): boolean =>
        nodes.some(n =>
          n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.children?.length ? hasMatchInChildren(n.children) : false)
        )
      if (hasMatchInChildren(node.children)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(true)
      }
    }
  }, [searchTerm, hasChildren, node.children])

  // Hide node if it doesn't match search and has no matching children
  const visible = useMemo(() => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const selfMatch = node.name.toLowerCase().includes(term)
    if (selfMatch) return true
    if (!hasChildren) return false
    const hasDeepMatch = (nodes: WikiCategoryTree[]): boolean =>
      nodes.some(n =>
        n.name.toLowerCase().includes(term) ||
        (n.children?.length ? hasDeepMatch(n.children) : false)
      )
    return hasDeepMatch(node.children)
  }, [searchTerm, node, hasChildren])

  if (!visible) return null

  return (
    <Box w="full">
      <HStack
        gap={0}
        w="full"
        py={1.5}
        px={2}
        pl={`${depth * 20 + 8}px`}
        cursor="pointer"
        borderRadius="sm"
        bg={isSelected ? "blue.50" : "transparent"}
        _dark={isSelected ? { bg: "blue.950" } : undefined}
        _hover={{ bg: isSelected ? "blue.100" : "gray.50", _dark: { bg: isSelected ? "blue.900" : "whiteAlpha.50" } }}
        transition="background 0.1s"
        onClick={() => onSelect(node)}
      >
        {/* Кнопка раскрытия — только для узлов с детьми */}
        <Box
          w="24px"
          h="24px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }
          }}
          cursor={hasChildren ? "pointer" : "default"}
          borderRadius="sm"
          _hover={hasChildren ? { bg: "gray.200", _dark: { bg: "whiteAlpha.200" } } : undefined}
        >
          {hasChildren ? (
            isOpen ? <LuChevronDown size={12} /> : <LuChevronRight size={12} />
          ) : (
            <Box w="4px" h="4px" borderRadius="full" bg="gray.300" />
          )}
        </Box>

        {/* Иконка */}
        <Box color={hasChildren ? "blue.500" : "gray.400"} flexShrink={0} mr={2}>
          {hasChildren ? (isOpen ? <LuFolderOpen size={14} /> : <LuFolder size={14} />) : <LuFile size={12} />}
        </Box>

        {/* Название */}
        <Text
          fontSize="sm"
          fontWeight={isSelected ? "semibold" : hasChildren ? "medium" : "normal"}
          color={isSelected ? "blue.600" : "fg.default"}
          _dark={isSelected ? { color: "blue.300" } : undefined}
          truncate
        >
          {node.name}
        </Text>
      </HStack>

      {/* Дочерние */}
      {hasChildren && (
        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <VStack gap={0} align="stretch">
              {node.children.map((child) => (
                <SelectTreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  searchTerm={searchTerm}
                />
              ))}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  )
}

// --- Основной компонент ---
interface CategoryTreeSelectProps {
  data: WikiCategoryTree[]
  value?: number
  onChange?: (categoryId: number | undefined) => void
  placeholder?: string
  label?: string
  helperText?: string
  disabled?: boolean
  isLoading?: boolean
}

export function CategoryTreeSelect({
  data,
  value,
  onChange,
  placeholder = "Выберите категорию",
  label,
  helperText,
  disabled = false,
  isLoading = false,
}: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  // Найти выбранную категорию по ID (рекурсивно)
  const selectedName = useMemo(() => {
    const find = (nodes: WikiCategoryTree[]): string | null => {
      for (const n of nodes) {
        if (n.id === value) return n.name
        if (n.children?.length) {
          const found = find(n.children)
          if (found) return found
        }
      }
      return null
    }
    return value ? find(data) : null
  }, [data, value])

  const handleSelect = (node: WikiCategoryTree) => {
    onChange?.(node.id)
    setOpen(false)
    setSearchTerm("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
    setSearchTerm("")
  }

  return (
    <Box w="full">
      {label && (
        <Text mb={1} fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      )}
      <Popover.Root
        open={open}
        onOpenChange={(e) => {
          setOpen(e.open)
          if (e.open) {
            setSearchTerm("")
            // Focus search input after popover opens
            setTimeout(() => searchRef.current?.focus(), 50)
          }
        }}
        positioning={{ sameWidth: true, placement: "bottom-start" }}
      >
        <Popover.Trigger asChild>
          <HStack
            w="full"
            px={3}
            py={2}
            borderWidth="1px"
            borderColor={open ? "border.emphasized" : "border.default"}
            borderRadius="md"
            cursor={disabled ? "not-allowed" : "pointer"}
            opacity={disabled ? 0.5 : 1}
            bg="bg.surface"
            transition="border-color 0.15s"
            _hover={!disabled ? { borderColor: "border.emphasized" } : undefined}
            justify="space-between"
            onClick={(e) => { if (disabled) e.preventDefault() }}
          >
            <Text
              fontSize="sm"
              color={selectedName ? "fg.default" : "fg.muted"}
              truncate
            >
              {isLoading ? "Загрузка..." : selectedName || placeholder}
            </Text>
            <HStack gap={1} flexShrink={0}>
              {value && (
                <Box
                  as="button"
                  display="flex"
                  alignItems="center"
                  p={0.5}
                  borderRadius="sm"
                  color="fg.muted"
                  _hover={{ color: "fg.default", bg: "gray.100" }}
                  onClick={handleClear}
                >
                  <LuX size={14} />
                </Box>
              )}
              <Box color="fg.muted">
                <LuSelectArrow size={14} />
              </Box>
            </HStack>
          </HStack>
        </Popover.Trigger>

        <Portal>
          <Popover.Positioner>
            <Popover.Content
              w="full"
              maxH="300px"
              p={0}
              overflow="hidden"
              borderRadius="md"
              boxShadow="lg"
            >
              {/* Поиск */}
              <Box p={2} borderBottomWidth="1px" borderColor="border.muted">
                <Input
                  ref={searchRef}
                  size="sm"
                  placeholder="Поиск категории..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </Box>

              {/* Дерево */}
              <Box overflowY="auto" maxH="250px" py={1}>
                {data.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted" p={3} textAlign="center">
                    Нет категорий
                  </Text>
                ) : (
                  <VStack gap={0} align="stretch">
                    {data.map((node) => (
                      <SelectTreeItem
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedId={value}
                        onSelect={handleSelect}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
      {helperText && (
        <Text mt={1} fontSize="xs" color="fg.muted">
          {helperText}
        </Text>
      )}
    </Box>
  )
}
