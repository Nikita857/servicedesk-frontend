"use client";

import { Page } from "@/types";
import {
  ButtonGroup,
  Center,
  IconButton,
  Pagination,
  Stack,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

interface Props {
  page: Page | undefined;
  action: (arg: number) => void;
  size: "xs" | "md" | "lg" | "sm" | "xl";
}

export const SDPagination = ({ page, action, size }: Props) => {
  if (!page || page.totalPages <= 1) return null;

  return (
    <Center mb={2}>
      <Stack gap="8">
        <Pagination.Root
          count={page.totalElements}
          pageSize={page.size}
          defaultPage={page.number + 1}
        >
          <ButtonGroup variant="ghost" size={size}>
            <Pagination.PrevTrigger asChild>
              <IconButton onClick={() => action(Math.max(0, page.number - 1))}>
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items
              render={(item) => (
                <IconButton
                  key={item.value}
                  variant={{
                    base: "ghost",
                    _selected: "outline",
                  }}
                  onClick={() => action(item.value - 1)}
                >
                  {item.value}
                </IconButton>
              )}
            />

            <Pagination.NextTrigger asChild>
              <IconButton
                onClick={() =>
                  action(Math.min(page.totalPages - 1, page.number + 1))
                }
              >
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      </Stack>
    </Center>
  );
};
