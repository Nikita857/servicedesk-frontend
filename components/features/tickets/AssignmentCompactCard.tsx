"use client";

import { Box, Flex, Text, Badge, HStack } from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";
import type { Assignment } from "@/lib/api/assignments";

interface AssignmentCompactCardProps {
  assignment: Assignment;
  onClick: (assignment: Assignment) => void;
}

export function AssignmentCompactCard({
  assignment,
  onClick,
}: AssignmentCompactCardProps) {
  return (
    <Box
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.subtle"
      px={2.5}
      py={1.5}
      cursor="pointer"
      transition="all 0.15s"
      _hover={{
        bg: "bg.muted",
        borderColor: "border.default",
      }}
      onClick={() => onClick(assignment)}
    >
      <Flex align="center" justify="space-between" gap={2}>
        <HStack gap={2} flex={1} minW={0}>
          <Text
            fontSize="xs"
            color="fg.muted"
            fontWeight="medium"
            flexShrink={0}
          >
            #{assignment.ticketId}
          </Text>
          <Text
            fontWeight="medium"
            fontSize="xs"
            color="fg.default"
            lineClamp={1}
          >
            {assignment.ticketTitle}
          </Text>
        </HStack>

        {assignment.fromLineName && (
          <HStack gap={1} flexShrink={0}>
            <LuArrowRight size={10} color="gray" />
            <Badge variant="subtle" colorPalette="blue" size="xs">
              {assignment.fromLineName}
            </Badge>
          </HStack>
        )}
      </Flex>
    </Box>
  );
}
