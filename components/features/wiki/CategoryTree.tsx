'use client'

import {
  Box,
  HStack,
  Text,
  IconButton,
  Collapsible,
  VStack,
  Badge
} from "@chakra-ui/react"
import { LuChevronRight, LuChevronDown, LuFolder, LuFolderOpen, LuFile, LuPencil, LuTrash } from "react-icons/lu"
import { useState } from "react"
import type { WikiCategoryTree } from "@/lib/api/wiki"

// --- Компонент одного узла (Рекурсивный) ---
interface TreeItemProps {
  node: WikiCategoryTree
  depth?: number
  onEdit?: (node: WikiCategoryTree) => void
  onDelete?: (id: number) => void
}

const TreeItem = ({ node, depth = 0, onEdit, onDelete }: TreeItemProps) => {
  const [isOpen, setIsOpen] = useState(depth === 0)
  const hasChildren = node.children && node.children.length > 0

  return (
    <Box w="full">
      <Box
        position="relative"
        cursor="pointer"
        w="full"
        py={1.5}
        px={2}
        borderRadius="md"
        transition="background 0.15s"
        css={{
          "&:hover": { background: "var(--chakra-colors-gray-50)" },
          "&:hover .tree-actions": { opacity: 1 },
          _dark: {
            "&:hover": { background: "var(--chakra-colors-white-alpha-50)" },
          },
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (hasChildren) setIsOpen(!isOpen)
        }}
      >
        <HStack gap={2} pl={depth * 6}>
          {/* Стрелка раскрытия */}
          <Box w="18px" display="flex" justifyContent="center" alignItems="center" color="fg.muted" flexShrink={0}>
            {hasChildren ? (
              isOpen ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />
            ) : (
              <Box w="4px" h="4px" borderRadius="full" bg="gray.300" />
            )}
          </Box>

          {/* Иконка */}
          <Box color={hasChildren ? "blue.500" : "gray.400"} flexShrink={0}>
            {hasChildren ? (isOpen ? <LuFolderOpen size={16} /> : <LuFolder size={16} />) : <LuFile size={14} />}
          </Box>

          {/* Название и мета */}
          <HStack gap={2} flex={1} minW={0}>
            <Text fontSize="sm" fontWeight={"medium"} truncate>
              {node.name}
            </Text>
            <Badge size="xs" variant="surface" colorPalette="gray" flexShrink={0}>
              #{node.id}
            </Badge>
            {node.departmentName && (
              <Badge size="xs" variant="subtle" colorPalette="blue" flexShrink={0}>
                {node.departmentName}
              </Badge>
            )}
            {node.description && (
              <Text fontSize="xs" color="fg.muted" truncate maxW="250px">
                {node.description}
              </Text>
            )}
          </HStack>

          {/* Кнопки (видны при наведении) */}
          <HStack
            className="tree-actions"
            gap={0}
            flexShrink={0}
            opacity={0}
            transition="opacity 0.15s"
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              variant="ghost"
              size="xs"
              aria-label="Редактировать"
              onClick={() => onEdit?.(node)}
            >
              <LuPencil size={14} />
            </IconButton>
            <IconButton
              variant="ghost"
              size="xs"
              colorPalette="red"
              aria-label="Удалить"
              onClick={() => onDelete?.(node.id)}
            >
              <LuTrash size={14} />
            </IconButton>
          </HStack>
        </HStack>
      </Box>

      {/* Дочерние узлы */}
      {hasChildren && (
        <Collapsible.Root open={isOpen}>
          <Collapsible.Content>
            <Box borderLeftWidth="1px" borderColor="border.muted" ml={`${depth * 24 + 20}px`}>
              <VStack gap={0} align="stretch">
                {node.children.map((child) => (
                  <TreeItem
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </VStack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  )
}

// --- Главный компонент ---
interface CategoryTreeProps {
  data: WikiCategoryTree[]
  onEdit?: (node: WikiCategoryTree) => void
  onDelete?: (id: number) => void
}

export const CategoryTree = ({ data, onEdit, onDelete }: CategoryTreeProps) => {
  if (!data || data.length === 0) {
    return (
      <Box py={8} textAlign="center">
        <Text color="fg.muted">Категории не найдены</Text>
      </Box>
    )
  }

  return (
    <VStack gap={0} align="stretch" w="full">
      {data.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </VStack>
  )
}
