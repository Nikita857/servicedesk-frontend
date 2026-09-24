import type {
  LineTicketStatsResponse as WireLineStats,
  ReassignmentHistoryResponse as WireReassignment,
  ResolutionTimeResponse as WireResolution,
  TicketHistoryResponse as WireHistory,
  TicketReportListResponse as WireTicketReport,
  TicketStatsByCategoryResponse as WireCategoryStats,
  TicketStatsByStatusResponse as WireStatusStats,
  UserTicketStatsResponse as WireUserStats,
  GetStatsByAllLinesParams,
} from '@/lib/api/generated/models';
import type { TicketStatus } from './ticket';

export type UserTicketStatsResponse = Required<WireUserStats>;
export type LineTicketStatsResponse = Required<WireLineStats>;
export type StatsQueryParams = GetStatsByAllLinesParams;

// UI query state; generated.getTicketsByLineAndStatus receives its pageable form.
export interface ListBySupLineAndStatusParams {
  ticketStatus: TicketStatus[];
  lineId: number;
  page: number;
  size: number;
}

// Kept for the deprecated, unavailable report methods' import signatures.
export interface TimeReportBySpecialist {
  specialistId: number;
  username: string;
  fio: string;
  totalSeconds: number;
  ticketCount: number;
  formattedTime: string;
}
export interface TimeReportByLine {
  lineId: number;
  lineName: string;
  lineLevel: number;
  totalSeconds: number;
  ticketCount: number;
  specialistCount: number;
  formattedTime: string;
}

export type TicketHistory = Omit<Required<WireHistory>,
  'assignedToFio' | 'supportLine' | 'resolvedAt' | 'closedAt' | 'deletedAt'> & {
  assignedToFio: string | null;
  supportLine: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  deletedAt: string | null;
};
export type ReassignmentHistory = Omit<Required<WireReassignment>,
  'fromUserFio' | 'toUserFio' | 'fromLine' | 'toLine' | 'note' | 'acceptedAt' | 'rejectedAt' | 'rejectedReason'> & {
  fromUserFio: string | null;
  toUserFio: string | null;
  fromLine: string | null;
  toLine: string | null;
  note: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
};
export type ResolutionTimeStats = Required<WireResolution>;
export type TicketStatsByCategory = Omit<Required<WireCategoryStats>,
  'categoryId' | 'categoryName' | 'categoryType'> & {
  categoryId: number | null;
  categoryName: string | null;
  categoryType: string | null;
};
export type TicketStatsByStatus = Required<WireStatusStats>;
export type TicketReportListResponse = Omit<Required<WireTicketReport>,
  'assignedToFio' | 'closedAt' | 'supportLine'> & {
  assignedToFio: string | null;
  closedAt: string | null;
  supportLine: string | null;
};

// Kept for the deprecated, unavailable report method's import signature.
export interface SpecialistWorkload {
  specialistId: number;
  username: string;
  fio: string;
  activeTickets: number;
  resolvedToday: number;
  totalTimeToday: number;
  avgResolutionTime: number;
  formattedTimeToday: string;
}
