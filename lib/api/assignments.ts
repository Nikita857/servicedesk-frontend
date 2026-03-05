import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { AssignmentResponse, CreateAssignmentRequest, RejectAssignmentRequest } from "@/types/assignment";
import type { SupportLineListResponse } from "@/types/support-line";

export const assignmentApi = {
  // Create new assignment (escalate ticket)
  create: async (data: CreateAssignmentRequest): Promise<AssignmentResponse> => {
    const response = await api.post<ApiResponse<AssignmentResponse>>(
      "/assignments",
      data
    );
    return response.data.data;
  },

  // Get assignment by ID
  get: async (id: number): Promise<AssignmentResponse> => {
    const response = await api.get<ApiResponse<AssignmentResponse>>(
      `/assignments/${id}`
    );
    return response.data.data;
  },

  // Get current active assignment for ticket
  getCurrentForTicket: async (ticketId: number): Promise<AssignmentResponse | null> => {
    try {
      const response = await api.get<ApiResponse<AssignmentResponse>>(
        `/tickets/${ticketId}/current-assignment`
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  // Get assignment history for ticket
  getTicketHistory: async (ticketId: number): Promise<AssignmentResponse[]> => {
    const response = await api.get<ApiResponse<AssignmentResponse[]>>(
      `/tickets/${ticketId}/assignments`
    );
    return response.data.data;
  },

  // Get my pending assignments
  getMyPending: async (page = 0, size = 20): Promise<PaginatedResponse<AssignmentResponse>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<AssignmentResponse>>>(
      "/assignments/pending",
      {
        params: { page, size },
      }
    );
    return response.data.data;
  },

  // Get pending count
  getPendingCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<number>>(
      "/assignments/pending-count"
    );
    return response.data.data;
  },

  // Accept assignment
  accept: async (id: number): Promise<AssignmentResponse> => {
    const response = await api.post<ApiResponse<AssignmentResponse>>(
      `/assignments/${id}/accept`
    );
    return response.data.data;
  },

  // Reject assignment
  reject: async (id: number, reason: string): Promise<AssignmentResponse> => {
    const response = await api.post<ApiResponse<AssignmentResponse>>(
      `/assignments/${id}/reject`,
      { reason }
    );
    return response.data.data;
  },

  /**
   * Get available lines for forwarding based on user role
   * Respects forwarding rules: SYSADMIN → ONE_C_SUPPORT, etc.
   */
  getAvailableForwardingLines: async (): Promise<SupportLineListResponse[]> => {
    const response = await api.get<ApiResponse<SupportLineListResponse[]>>(
      "/assignments/available-lines"
    );
    return response.data.data;
  },
};
