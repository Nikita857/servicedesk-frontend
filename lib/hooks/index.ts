// Auth
export { useAuth } from "./shared/useAuth";

// Dashboard
export { useDashboardQuery } from "./shared/useDashboardQuery";

// Wiki
export { useWikiArticlesQuery } from "./wiki/useWikiArticlesQuery";
export { useWikiArticleQuery } from "./wiki/useWikiArticleQuery";
export { useWikiCategoriesQuery } from "./wiki/useWikiCategoriesQuery";
export { useWikiCategoriesWithArticlesQuery } from "./wiki/useWikiCategoriesWithArticlesQuery";
export { useWikiTreeState } from "./wiki/useWikiTreeState";
export type { WikiTreeState } from "./wiki/useWikiTreeState";
export { useOnboarding } from "./shared/useOnboarding";
export type { OnboardingControls } from "./shared/useOnboarding";

// Categories
export {
  useCategoriesQuery,
  useCategoryDetailQuery,
} from "./shared/useCategoriesQuery";

// Support Lines
export { useAllSupportLinesQuery } from "./support-lines/useAllSupportLinesQuery";

// Tickets List Page
export * from "./tickets-list";

// Ticket Detail Page
export * from "./ticket-detail";

// Pagination
export { usePersistentPage } from "./shared/usePersistentPage";

// User Status
export { useUserStatusQuery } from "./user/useUserStatusQuery";

// Stats
export * from "./shared/useStatsQuery";

// File Upload
export { useFileUpload } from "./shared/useFileUpload";

// Assignments WebSocket
export { useAssignmentsWebSocket } from "./shared/useAssignmentsWebSocket";

// Ticket Chat
export * from "./ticket-chat/useChatActions";

// Admin Wiki
export * from "./admin-wiki";

// Heartbeat
export { useHeartbeat } from "./shared/useHeartbeat";
