import type { SupportLineListResponse, SupportLineDetail, Specialist, CreateSupportLineRequest, UpdateSupportLineRequest, UpdateSupportLineChatId } from '@/types/support-line';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const supportLineApi = {
  list: async (): Promise<SupportLineListResponse[]> => (await generated.getAllLines()).data as SupportLineListResponse[],
  getAll: async (): Promise<SupportLineListResponse[]> => (await generated.getAllLines()).data as SupportLineListResponse[],
  get: async (id: number): Promise<SupportLineDetail> => (await generated.getLine(id)).data as SupportLineDetail,
  getAvailableForAssignment: async (): Promise<SupportLineListResponse[]> => (await generated.getAvailableForAssignment()).data as SupportLineListResponse[],
  getSpecialists: async (lineId: number): Promise<Specialist[]> => (await generated.getSpecialists(lineId)).data as Specialist[],
  getMyLines: async (): Promise<SupportLineListResponse[]> => (await generated.getMyLines()).data as SupportLineListResponse[],
  create: async (data: CreateSupportLineRequest): Promise<SupportLineDetail> => (await generated.createLine(data)).data as SupportLineDetail,
  deleteLine: async (id: number): Promise<void> => { await generated.deleteLine(id); },
  update: async (id: number, data: UpdateSupportLineRequest): Promise<SupportLineDetail> => (await generated.updateLine(id, data)).data as SupportLineDetail,
  addSpecialist: async (lineId: number, userId: number): Promise<SupportLineDetail> => (await generated.addSpecialist(lineId, userId)).data as SupportLineDetail,
  removeSpecialist: async (lineId: number, userId: number): Promise<SupportLineDetail> => (await generated.removeSpecialist(lineId, userId)).data as SupportLineDetail,
  updateChatIds: async (lineId: number, data: UpdateSupportLineChatId): Promise<SupportLineDetail> => (await generated.setBitrixChatId(lineId, data)).data as SupportLineDetail,
};

export type { Specialist };
