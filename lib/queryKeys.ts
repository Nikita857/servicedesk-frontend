/**
 * Константы ключей для React Query
 * Используются для кэширования и инвалидации запросов
 */

export const queryKeys = {
  // Tickets
  tickets: {
    all: ["tickets"] as const,
    lists: () => [...queryKeys.tickets.all, "list"] as const,
    list: (filter: Record<string, unknown>) =>
      [...queryKeys.tickets.lists(), filter] as const,
    details: () => [...queryKeys.tickets.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.tickets.details(), id] as const,
    counts: () => [...queryKeys.tickets.all, "counts"] as const,
  },

  // Assignments
  assignments: {
    all: ["assignments"] as const,
    pending: (page: number) => [...queryKeys.assignments.all, "pending", page] as const,
    current: (ticketId: number) =>
      [...queryKeys.assignments.all, "current", ticketId] as const,
    history: (ticketId: number) =>
      [...queryKeys.assignments.all, "history", ticketId] as const,
  },

  // Support Lines
  supportLines: {
    all: ["supportLines"] as const,
    list: () => [...queryKeys.supportLines.all, "list"] as const,
    specialists: (lineId: number) =>
      [...queryKeys.supportLines.all, "specialists", lineId] as const,
  },

  // Wiki
  wiki: {
    all: ["wiki"] as const,
    lists: () => [...queryKeys.wiki.all, "list"] as const,
    list: (params: { page?: number; search?: string; categoryId?: number }) =>
      [...queryKeys.wiki.lists(), params] as const,
    details: () => [...queryKeys.wiki.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.wiki.details(), slug] as const,
    popular: () => [...queryKeys.wiki.all, "popular"] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    current: () => [...queryKeys.users.all, "current"] as const,
    myStatus: () => [...queryKeys.users.all, "my-status"] as const,
    status: (userId: number) => [...queryKeys.users.all, "status", userId] as const,
    search: (query: string) => [...queryKeys.users.all, "search", query] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
    userSelectable: () => [...queryKeys.categories.all, "user-selectable"] as const,
  },

  // Reports
  reports: {
    all: ["reports"] as const,
    ticketsByStatus: () => [...queryKeys.reports.all, "tickets-by-status"] as const,
    ticketsByCategory: () => [...queryKeys.reports.all, "tickets-by-category"] as const,
    specialistWorkload: () => [...queryKeys.reports.all, "specialist-workload"] as const,
  },
} as const;

