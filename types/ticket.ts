// Ticket types based on OpenAPI spec

export type TicketStatus = 
  | 'NEW' 
  | 'OPEN' 
  | 'PENDING' 
  | 'ESCALATED' 
  | 'RESOLVED' 
  | 'PENDING_CLOSURE'
  | 'CLOSED' 
  | 'REOPENED' 
  | 'REJECTED' 
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserShort {
  id: number;
  username: string;
  fio: string | null;
}

export interface CategoryShort {
  id: number;
  name: string;
}

export interface SupportLineShort {
  id: number;
  name: string;
  description: string | null;
  slaMinutes: number;
  specialistCount: number;
  displayOrder: number;
}

// List item (for tables)
export interface TicketListItem {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdByUsername: string;
  assignedToUsername: string | null;
  supportLineName: string | null;
  createdAt: string;
  slaDeadline: string | null;
}

// Full ticket response
export interface Ticket {
  id: number;
  title: string;
  description: string;
  link1c: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: UserShort;
  assignedTo: UserShort | null;
  supportLine: SupportLineShort | null;
  categoryUser: CategoryShort | null;
  categorySupport: CategoryShort | null;
  timeSpentSeconds: number;
  messageCount: number;
  attachmentCount: number;
  slaDeadline: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastAssignment: LastAssignment | null;
}

// Assignment embedded in ticket response
export interface LastAssignment {
  id: number;
  ticketId: number;
  fromLineId: number | null;
  fromLineName: string | null;
  fromUserId: number | null;
  fromUsername: string | null;
  fromFio: string | null;
  toLineId: number;
  toLineName: string;
  toUserId: number | null;
  toUsername: string | null;
  toFio: string | null;
  note: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

// Request DTOs
export interface CreateTicketRequest {
  title: string;
  description: string;
  link1c?: string;
  categoryUserId?: number;
  priority?: TicketPriority;
  supportLineId?: number;
  assignToUserId?: number; // Прямое назначение специалисту
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  link1c?: string;
  priority?: TicketPriority;
}

export interface ChangeStatusRequest {
  status: TicketStatus;
  comment?: string;
}

// Paginated response
export interface PagedTicketList {
  content: TicketListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Status labels and colors
export const ticketStatusConfig: Record<TicketStatus, { label: string; color: string }> = {
  NEW: { label: 'Новый', color: 'blue' },
  OPEN: { label: 'Открыт', color: 'green' },
  PENDING: { label: 'Ожидание', color: 'yellow' },
  ESCALATED: { label: 'Эскалирован', color: 'orange' },
  RESOLVED: { label: 'Решён', color: 'teal' },
  PENDING_CLOSURE: { label: 'Ожидает закрытия', color: 'cyan' },
  CLOSED: { label: 'Закрыт', color: 'gray' },
  REOPENED: { label: 'Переоткрыт', color: 'purple' },
  REJECTED: { label: 'Отклонён', color: 'red' },
  CANCELLED: { label: 'Отменён', color: 'gray' },
};

export const ticketPriorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  LOW: { label: 'Низкий', color: 'gray' },
  MEDIUM: { label: 'Средний', color: 'blue' },
  HIGH: { label: 'Высокий', color: 'orange' },
  URGENT: { label: 'Срочный', color: 'red' },
};

// Status transition rules - which statuses can transition to which
export const statusTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['OPEN', 'REJECTED', 'CANCELLED'],
  OPEN: ['PENDING', 'ESCALATED', 'RESOLVED', 'CANCELLED'],
  PENDING: ['OPEN', 'RESOLVED', 'CANCELLED'],
  ESCALATED: ['OPEN', 'PENDING', 'RESOLVED'],
  RESOLVED: ['PENDING_CLOSURE', 'REOPENED'], // Специалист запрашивает закрытие
  PENDING_CLOSURE: ['CLOSED', 'REOPENED'], // Пользователь подтверждает или отклоняет
  CLOSED: ['REOPENED'],
  REOPENED: ['OPEN', 'PENDING', 'RESOLVED', 'CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
};

// User-allowed transitions (regular users)
export const userStatusTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['CANCELLED'],
  OPEN: ['CANCELLED'],
  PENDING: ['CANCELLED'],
  ESCALATED: [],
  RESOLVED: ['REOPENED'],
  PENDING_CLOSURE: ['CLOSED', 'REOPENED'], // Пользователь может подтвердить закрытие или переоткрыть
  CLOSED: ['REOPENED'],
  REOPENED: ['CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
};

