"use client";

import { Button, ButtonProps } from "@chakra-ui/react";
import { LuArrowLeft } from "react-icons/lu";
import Link from "next/link";

interface BackButtonProps extends ButtonProps {
  href: string;
  label?: string;
}

export function BackButton({
  href,
  label = "Назад",
  ...props
}: BackButtonProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <Button variant="ghost" size="sm" as="a" {...props}>
        <LuArrowLeft />
        {label}
      </Button>
    </Link>
  );
}
