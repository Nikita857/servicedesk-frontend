import { getServiceDeskAPI } from './generated/client';
import type { AssignmentCreateRequest } from './generated/models';
import { requireData } from './ticketContractView';
import type { PaginatedResponse } from '@/types/api';
import type { AssignmentResponse, CreateAssignmentRequest, RejectAssignmentRequest } from '@/types/assignment';
import type { SupportLineListResponse } from '@/types/support-line';

const generated = getServiceDeskAPI();
const asAssignment = (value: unknown): AssignmentResponse => value as AssignmentResponse;

export const assignmentApi = {
  create: async (data: CreateAssignmentRequest): Promise<AssignmentResponse> =>
    asAssignment(requireData(await generated.createAssignment(data as AssignmentCreateRequest))),
  cancel: async (id: number, data: RejectAssignmentRequest): Promise<void> => { await generated.cancelAssignment(id, data); },
  get: async (id: number): Promise<AssignmentResponse> => asAssignment(requireData(await generated.getAssignment(id))),
  getCurrentForTicket: async (ticketId: number): Promise<AssignmentResponse | null> => {
    try {
      const response = await generated.getCurrentAssignment(ticketId);
      if (response.success === false) return null;
      return response.data ? asAssignment(response.data) : null;
    } catch {
      return null;
    }
  },
  getTicketHistory: async (ticketId: number): Promise<AssignmentResponse[]> =>
    requireData(await generated.getTicketAssignments(ticketId)) as AssignmentResponse[],
  getMyPending: async (page = 0, size = 20): Promise<PaginatedResponse<AssignmentResponse>> => {
    const wire = requireData(await generated.getMyPendingAssignments({ pageable: { page, size } }));
    return { content: (wire.content ?? []) as AssignmentResponse[], page: {
      number: wire.number ?? 0, size: wire.size ?? 0, totalElements: wire.totalElements ?? 0, totalPages: wire.totalPages ?? 0,
    } };
  },
  getPendingCount: async (): Promise<number> => requireData(await generated.getPendingCount()),
  accept: async (id: number): Promise<AssignmentResponse> => asAssignment(requireData(await generated.acceptAssignment(id))),
  reject: async (id: number, reason: string): Promise<AssignmentResponse> => asAssignment(requireData(await generated.rejectAssignment(id, { reason }))),
  getMyCoExecutorTicketIds: async (): Promise<number[]> => requireData(await generated.getTicketWhereICoExecutor()),
  getAvailableForwardingLines: async (): Promise<SupportLineListResponse[]> =>
    requireData(await generated.getAvailableForwardingLines()) as SupportLineListResponse[],
};
