import type { UserActivityStatus, UserSearchResult, UserStatusResponse } from '@/types/auth';
import { getServiceDeskAPI } from './generated/client';
import type { UserSearchResponse as WireUserSearchResponse, UserStatusResponse as WireUserStatusResponse } from './generated/models';
import { requireData } from './ticketContractView';

const generated = getServiceDeskAPI();

function toSearchResult(wire: WireUserSearchResponse): UserSearchResult {
  if (wire.id == null || wire.username == null) throw new Error('User search response is missing required data');
  return { id: wire.id, username: wire.username, fio: wire.fio ?? '' };
}

function toStatusView(wire: WireUserStatusResponse): UserStatusResponse {
  if (wire.status == null || wire.availableForAssignment == null || wire.updatedAt == null) {
    throw new Error('User status response is missing required data');
  }
  return { status: wire.status, availableForAssignment: wire.availableForAssignment, updatedAt: wire.updatedAt };
}

export const userApi = {
  search: async (query: string): Promise<UserSearchResult[]> => (requireData(await generated.searchUsers({ q: query })).content ?? []).map(toSearchResult),
  getMyStatus: async (): Promise<UserStatusResponse> => toStatusView(requireData(await generated.getStatus1())),
  getUserStatus: async (userId: number): Promise<UserStatusResponse> => toStatusView(requireData(await generated.getUserStatus(userId))),
  updateMyStatus: async (status: UserActivityStatus): Promise<UserStatusResponse> => toStatusView(requireData(await generated.changeStatus({ status }))),
  heartbeat: async (): Promise<void> => { await generated.heartbeat(); },
};
