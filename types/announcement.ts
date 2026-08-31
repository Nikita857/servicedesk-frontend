// Типы фичи "Объявления" — должны совпадать с ru.bormash.servicedesk.feature.announcement.dto.*

export interface CreateAnnouncementRequest {
  title: string; // required, max 250
  body: string; // required, max 5000
  expiresAt?: string; // ISO 8601, опционально — @Future на бэке
  broadcastAll: boolean;
  departmentIds?: number[];
  userIds?: number[];
}

export interface MyAnnouncementResponse {
  id: number;
  title: string;
  body: string;
  expiresAt: string | null;
  read: boolean;
  expired: boolean;
}

export interface AnnouncementDetailResponse {
  id: number;
  title: string;
  body: string;
  expiresAt: string | null;
  read: boolean;
}

export interface AnnouncementManagementResponse {
  id: number;
  title: string;
  body: string;
  expiresAt: string | null;
  archivedAt: string | null;
  broadcastAll: boolean;
  totalRecipients: number;
  totalRead: number;
  createdAt: string;
  targetDepartmentNames: string[];
  targetUserNames: string[];
}
