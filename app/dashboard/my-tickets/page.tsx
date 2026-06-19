"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { UserTicketsView } from "@/components/features/tickets/UserTicketsView";

export default function MyTicketsPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();

  useEffect(() => {
    if (isHydrated && !has(PERM.TICKET_READ_LINE)) {
      router.replace("/dashboard/tickets");
    }
  }, [isHydrated, has, router]);

  if (!isHydrated || !has(PERM.TICKET_READ_LINE)) return null;

  return <UserTicketsView initialFilter="my" />;
}
