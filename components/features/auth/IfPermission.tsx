'use client';

import type { ReactNode } from 'react';
import { useCurrentPermissions } from '@/lib/hooks/shared/usePermissions';
import type { PermCode } from '@/lib/constants/permissions';

interface Props {
  /** Один permission — все варианты взаимоисключают друг друга. */
  perm?: PermCode | string;
  /** Показать если хотя бы один из permissions есть. */
  anyOf?: (PermCode | string)[];
  /** Показать только если все permissions есть. */
  allOf?: (PermCode | string)[];
  /** Что рендерить, если условие не выполнено. По умолчанию — ничего. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Показывает children только если у текущего пользователя есть нужный permission.
 *
 * Примеры:
 *   <IfPermission perm={PERM.WIKI_CREATE}>…</IfPermission>
 *   <IfPermission anyOf={[PERM.TICKET_READ_LINE, PERM.TICKET_READ_ALL]}>…</IfPermission>
 *   <IfPermission allOf={[PERM.REPORT_VIEW, PERM.USER_MANAGE]}>…</IfPermission>
 */
export function IfPermission({ perm, anyOf, allOf, fallback = null, children }: Props) {
  const { has, hasAny, hasAll } = useCurrentPermissions();

  let allowed = false;
  if (perm !== undefined) {
    allowed = has(perm);
  } else if (anyOf !== undefined) {
    allowed = hasAny(anyOf);
  } else if (allOf !== undefined) {
    allowed = hasAll(allOf);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
