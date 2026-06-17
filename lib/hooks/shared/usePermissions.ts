'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/stores';
import type { PermCode } from '@/lib/constants/permissions';

export function useCurrentPermissions() {
  const user = useAuthStore((s) => s.user);
  const set = useMemo(
    () => new Set<string>(user?.permissions ?? []),
    [user?.permissions]
  );

  return {
    permissions: user?.permissions ?? [],
    has: (perm: PermCode | string) => set.has(perm),
    hasAny: (perms: (PermCode | string)[]) => perms.some((p) => set.has(p)),
    hasAll: (perms: (PermCode | string)[]) => perms.every((p) => set.has(p)),
  };
}
