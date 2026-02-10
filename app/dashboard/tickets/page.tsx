"use client";

import { useAuthStore } from "@/stores";
import { AdminTicketsView } from "@/components/features/tickets";
import { useAssignmentsWebSocket } from "@/lib/hooks";
import { SpecialistTicketsView } from "@/components/features/tickets/SpecialistTicketsView";
import { UserTicketsView } from "@/components/features/tickets/UserTicketsView";

export default function TicketsPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isUser = userRoles.includes("USER");

  // WebSocket for assignments (real-time pending count updates)
  useAssignmentsWebSocket();

  
  // Switch views by user role

  if (isAdmin) {
    return <AdminTicketsView />;
  }

  if (isSpecialist) {
    return <SpecialistTicketsView />;
  }

  if(isUser) {
    return <UserTicketsView/>
  }

}
