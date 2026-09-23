import type { UserActivityStatus, UserSearchResult, UserStatusResponse } from '@/types/auth';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const userApi = {
  search: async (query: string): Promise<UserSearchResult[]> => (await generated.searchUsers({ q: query })).data?.content as UserSearchResult[],
  getMyStatus: async (): Promise<UserStatusResponse> => (await generated.getStatus1()).data as UserStatusResponse,
  getUserStatus: async (userId: number): Promise<UserStatusResponse> => (await generated.getUserStatus(userId)).data as UserStatusResponse,
  updateMyStatus: async (status: UserActivityStatus): Promise<UserStatusResponse> => (await generated.changeStatus({ status })).data as UserStatusResponse,
  heartbeat: async (): Promise<void> => { await generated.heartbeat(); },
};
