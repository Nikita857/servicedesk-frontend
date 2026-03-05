import type { TicketStatus, TicketStatusHistory } from "./ticket";

export interface UserTicketStatsResponse {
  userId: number;
  username: string;
  total: number;
  newTickets: number;
  openTickets: number;
  closedTickets: number;
  rejectedTickets: number;
  byStatus: Record<string, number>;
}

export interface LineTicketStatsResponse {
  lineId: number;
  lineName: string;
  total: number;
  newTickets: number;
  openTickets: number;
  closedTickets: number;
  rejectedTickets: number;
  byStatus: Record<string, number>;
}

export interface StatsQueryParams {
  page?: number;
  size?: number;
}

export interface ListBySupLineAndStatusParams {
  ticketStatus: TicketStatus[];
  lineId: number;
  page: number;
  size: number;
}

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

export interface TicketHistory {
  ticketId: number;
  title: string;
  status: string;
  priority: string;
  createdByFio: string;
  assignedToFio: string | null;
  supportLine: string | null;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  deletedAt: string | null;
  firstResponseTimeSeconds: number;
  totalUnassignedSeconds: number;
  totalActiveSeconds: number;
  statusHistory: TicketStatusHistory[];
}

export interface ReassignmentHistory {
  assignmentId: number;
  fromUserFio: string | null;
  toUserFio: string | null;
  fromLine: string | null;
  toLine: string | null;
  mode: string;
  status: string;
  note: string | null;
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

export interface ResolutionTimeStats {
  totalResolved: number;
  avgResolutionSeconds: number;
  minResolutionSeconds: number;
  maxResolutionSeconds: number;
  medianResolutionSeconds: number;
  formattedAvgTime: string;
}

export interface TicketStatsByCategory {
  categoryId: number | null;
  categoryName: string | null;
  categoryType: string | null;
  count: number;
  percentage: number;
}

export interface TicketStatsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface TicketReportItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdByFio: string;
  assignedToFio: string | null;
  supportLineName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  deletedAt: string | null;
}

export interface PagedTicketReport {
  content: TicketReportItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

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
