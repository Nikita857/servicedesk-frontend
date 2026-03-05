"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { UserTicketsView } from "@/components/features/tickets/UserTicketsView";

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  const isSpecialist = user?.specialist ?? false;

  useEffect(() => {
    if (isHydrated && !isSpecialist) {
      router.replace("/dashboard/tickets");
    }
  }, [isHydrated, isSpecialist, router]);

  if (!isHydrated || !isSpecialist) return null;

  return <UserTicketsView initialFilter="my" />;
}
