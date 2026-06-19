import { RoleResponse } from "@/types/rbac";
import { Badge, Text } from "@chakra-ui/react";
import { JSX } from "react";

export const AVAILABLE_COLORS = [
  "gray",
  "red",
  "blue",
  "yellow",
  "green",
  "teal",
  "blue",
  "cyan",
  "purple",
  "pink",
] as const;

export type RoleColor = (typeof AVAILABLE_COLORS)[number];

export const getRoleBadge = (
  role: string,
  allRoles: RoleResponse[],
): JSX.Element => {
  const found = allRoles.find((r) => r.code === `ROLE_${role}`);
  return (
    <Badge colorPalette={found?.color ?? "gray"} size="sm" variant="subtle">
      {found?.name ?? role}
    </Badge>
  );
};

export const getRoleAsText = (
  role: string,
  allRoles: RoleResponse[],
): JSX.Element => {
  const found = allRoles.find((r) => r.code === `ROLE_${role}`);
  return <Text as="span" color={found?.color ?? "gray"}>{found?.name ?? role}</Text>;
};

export function getRoleColorByCode(
  roles: RoleResponse[] | undefined,
  code: string,
): string {
  return roles?.find((r) => r.code === code)?.color ?? "gray";
}
