"use client";

import { Page } from "@/types";
import { Button, Center, HStack } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

interface Props {
  page: Page | undefined;
  /** Вызывается с 0-based индексом выбранной страницы */
  action: (arg: number) => void;
  size: "xs" | "md" | "lg" | "sm" | "xl";
}

const WINDOW = 5;

export const SDPagination = ({ page, action, size }: Props) => {
  if (!page || page.totalPages <= 1) return null;

  const current = page.number; // 0-based
  const { totalPages } = page;

  return (
    <Center>
      <HStack gap={2}>
        <Button
          size={size}
          variant="outline"
          disabled={current === 0}
          onClick={() => action(current - 1)}
        >
          <LuChevronLeft />
        </Button>

        <HStack gap={1}>
          {Array.from({ length: Math.min(totalPages, WINDOW) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= WINDOW) {
              pageNum = i;
            } else if (current < 3) {
              pageNum = i;
            } else if (current >= totalPages - 2) {
              pageNum = totalPages - WINDOW + i;
            } else {
              pageNum = current - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                size={size}
                variant={pageNum === current ? "solid" : "ghost"}
                onClick={() => action(pageNum)}
              >
                {pageNum + 1}
              </Button>
            );
          })}
        </HStack>

        <Button
          size={size}
          variant="outline"
          disabled={current >= totalPages - 1}
          onClick={() => action(current + 1)}
        >
          <LuChevronRight />
        </Button>
      </HStack>
    </Center>
  );
};
