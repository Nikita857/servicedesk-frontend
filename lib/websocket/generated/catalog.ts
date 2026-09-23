// Generated from backend/contracts/websocket-asyncapi.yml. Do not edit.


import type * as Models from './models';

export const clientDestinations = {
  dmSend: "/app/dm/send",
  dmTypingCommand: "/app/dm/typing",
  ticketRead: "/app/ticket/{ticketId}/read",
  ticketSend: "/app/ticket/{ticketId}/send",
  ticketTypingCommand: "/app/ticket/{ticketId}/typing",
} as const;

export interface ClientMessages {
  dmSend: Models.SendDirectMessageRequest;
  dmTypingCommand: Models.DmTypingIndicator;
  ticketRead: null;
  ticketSend: Models.SendMessageRequest;
  ticketTypingCommand: Models.TypingIndicator;
}

export const serverDestinations = {
  assignments: "/topic/user/{userId}/assignments",
  dmTyping: "/user/{userId}/queue/dm-typing",
  lineStatus: "/topic/line/{lineId}/status",
  notifications: "/topic/user/{userId}/notifications",
  privateMessages: "/user/{userId}/queue/private",
  rejectedAssignments: "/topic/user/{userId}/assignments/rejected",
  ticket: "/topic/ticket/{ticketId}",
  ticketAttachments: "/topic/ticket/{ticketId}/attachments",
  ticketDeleted: "/topic/ticket/{ticketId}/deleted",
  ticketInternal: "/topic/ticket/{ticketId}/internal",
  ticketMessages: "/topic/ticket/{ticketId}/messages",
  ticketReadReceipts: "/topic/ticket/{ticketId}/read",
  ticketTyping: "/topic/ticket/{ticketId}/typing",
  tickets: "/topic/tickets",
  userStatus: "/topic/user/{userId}/status",
} as const;

export interface ServerMessages {
  assignments: Models.AssignmentResponse;
  dmTyping: Models.DmTypingIndicator;
  lineStatus: Models.UserStatusChangeEvent;
  notifications: Models.Notification | Models.UnreadCountUpdatePayload;
  privateMessages: Models.DirectMessageResponse;
  rejectedAssignments: Models.AssignmentResponse;
  ticket: Models.TicketResponse;
  ticketAttachments: Models.AttachmentResponse;
  ticketDeleted: Models.TicketDeletedPayload;
  ticketInternal: Models.MessageResponse;
  ticketMessages: Models.MessageResponse;
  ticketReadReceipts: Models.ReadReceiptWS;
  ticketTyping: Models.TypingIndicator;
  tickets: Models.TicketListEventResponse;
  userStatus: Models.UserStatusChangeEvent;
}

export type ClientChannel = keyof ClientMessages;
export type ServerChannel = keyof ServerMessages;
