"use client";

import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { AdminTicketsView } from "@/components/features/tickets";
import { SpecialistTicketsView } from "@/components/features/tickets/SpecialistTicketsView";
import { UserTicketsView } from "@/components/features/tickets/UserTicketsView";

export default function TicketsPage() {
  const { has } = useCurrentPermissions();

  if (has(PERM.TICKET_READ_ALL)) return <AdminTicketsView />;
  if (has(PERM.TICKET_READ_LINE)) return <SpecialistTicketsView />;
  return <UserTicketsView />;
}
