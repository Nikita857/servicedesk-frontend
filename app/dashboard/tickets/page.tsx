"use client";

import { useAuthStore } from "@/stores";
import { AdminTicketsView } from "@/components/features/tickets";
import { SpecialistTicketsView } from "@/components/features/tickets/SpecialistTicketsView";
import { UserTicketsView } from "@/components/features/tickets/UserTicketsView";

export default function TicketsPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isSupervisor = userRoles.includes("SUPERVISOR");
  const isUser = userRoles.includes("USER");

  if (isAdmin || isSupervisor) {
    return <AdminTicketsView />;
  }

  if (isSpecialist) {
    return <SpecialistTicketsView />;
  }

  if (isUser) {
    return <UserTicketsView />;
  }
}
