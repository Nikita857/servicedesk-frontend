// Generated from backend/contracts/websocket-asyncapi.yml. Do not edit.

/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "AssignmentResponse".
 */
export interface AssignmentResponse {
  acceptedAt: string | null;
  createdAt: string | null;
  fromLine: SupportLineShortResponse | null;
  fromUser: UserShortResponse | null;
  id: number;
  mode: string;
  note: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  status: string;
  ticketId: number;
  ticketTitle: string;
  toLine: SupportLineShortResponse | null;
  toUser: UserShortResponse | null;
  type: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "SupportLineShortResponse".
 */
export interface SupportLineShortResponse {
  id: number;
  name: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "UserShortResponse".
 */
export interface UserShortResponse {
  avatarUrl: string | null;
  color: string | null;
  fio: string | null;
  id: number;
  isSpecialist: boolean;
  username: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "AttachmentResponse".
 */
export interface AttachmentResponse {
  createdAt: string | null;
  fileSize: number;
  filename: string;
  id: number;
  messageId: number | null;
  mimeType: string | null;
  ticketId: number | null;
  type: string;
  uploadedBy: UserShortResponse | null;
  url: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "CategoryResponse".
 */
export interface CategoryResponse {
  description: string | null;
  id: number;
  is1ClinkRecommended: boolean | null;
  name: string;
  type: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "CoExecutorResponse".
 */
export interface CoExecutorResponse {
  addedAt: string | null;
  addedById: number | null;
  addedByUsername: string | null;
  assignmentId: number;
  fio: string | null;
  userId: number;
  username: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "DirectMessageResponse".
 */
export interface DirectMessageResponse {
  content: string;
  createdAt: string | null;
  edited: boolean;
  id: number;
  read: boolean;
  recipient: UserShortResponse | null;
  sender: UserShortResponse | null;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "DmTypingIndicator".
 */
export interface DmTypingIndicator {
  recipientId: number;
  senderFio: string;
  senderId: number;
  typing: boolean;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "MessageResponse".
 */
export interface MessageResponse {
  attachments: AttachmentResponse[];
  content: string | null;
  createdAt: string | null;
  edited: boolean;
  id: number;
  internal: boolean;
  readBySpecialist: boolean;
  readByUser: boolean;
  sender: UserShortResponse | null;
  senderType: string;
  ticketId: number;
  updatedAt: string | null;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "Notification".
 */
export interface Notification {
  announcementId: number | null;
  announcementTitle: string | null;
  body: string;
  createdAt: string;
  senderId: number | null;
  senderName: string | null;
  surveyId: number | null;
  surveyTitle: string | null;
  ticketId: number | null;
  ticketTitle: string | null;
  title: string;
  type: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "ReadReceiptWS".
 */
export interface ReadReceiptWS {
  readAt: string | null;
  specialist: boolean;
  ticketId: number;
  userId: number;
  username: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "SendDirectMessageRequest".
 */
export interface SendDirectMessageRequest {
  content: string;
  recipientId: number;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "SendMessageRequest".
 */
export interface SendMessageRequest {
  content: string;
  internal?: boolean;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "SpecialistTypeResponse".
 */
export interface SpecialistTypeResponse {
  active: boolean;
  code: string;
  color: string | null;
  displayOrder: number;
  id: number;
  name: string;
  system: boolean;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "SupportLineListResponse".
 */
export interface SupportLineListResponse {
  description: string | null;
  displayOrder: number | null;
  id: number;
  name: string;
  slaMinutes: number | null;
  specialistCount: number | null;
  specialistIds: number[];
  specialistType: SpecialistTypeResponse | null;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "TicketDeletedPayload".
 */
export interface TicketDeletedPayload {
  deleted: true;
  id: number;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "TicketListEventResponse".
 */
export interface TicketListEventResponse {
  assigneeId: number | null;
  eventType: string;
  id: number;
  status: string | null;
  supportLineId: number | null;
  timestamp: string | null;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "TicketResponse".
 */
export interface TicketResponse {
  assignedTo: UserShortResponse | null;
  attachmentCount: number;
  categorySupport: CategoryResponse | null;
  categoryUser: CategoryResponse | null;
  closedAt: string | null;
  coExecutors: CoExecutorResponse[];
  createdAt: string | null;
  createdBy: UserShortResponse | null;
  description: string | null;
  estimatedCompletionDate: string | null;
  id: number;
  lastAssignment: AssignmentResponse | null;
  link1c: string | null;
  messageCount: number;
  priority: string;
  resolvedAt: string | null;
  slaDeadline: string | null;
  status: string;
  supportLine: SupportLineListResponse | null;
  timeSpentSeconds: number;
  title: string;
  updatedAt: string | null;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "TicketTypingCommand".
 */
export interface TicketTypingCommand {
  typing: boolean;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "TypingIndicator".
 */
export interface TypingIndicator {
  fio: string;
  ticketId: number;
  typing: boolean;
  userId: number;
  username: string;
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "UnreadCountUpdatePayload".
 */
export interface UnreadCountUpdatePayload {
  count: number;
  type: 'UNREAD_COUNT_UPDATE';
}
/**
 * This interface was referenced by `WebSocketModels`'s JSON-Schema
 * via the `definition` "UserStatusChangeEvent".
 */
export interface UserStatusChangeEvent {
  fio: string;
  lineIds: number[];
  oldStatus: string;
  status: string;
  userId: number;
  username: string;
}
