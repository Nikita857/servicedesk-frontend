import type { SpecialistTypeResponse } from '@/types/support-line';
import type { CreateSpecialistTypeRequest, UpdateSpecialistTypeRequest } from '@/types/rbac';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const specialistTypeApi = {
  getAll: async (): Promise<SpecialistTypeResponse[]> => (await generated.getAll()).data as SpecialistTypeResponse[],
  create: async (req: CreateSpecialistTypeRequest): Promise<SpecialistTypeResponse> => (await generated.create(req)).data as SpecialistTypeResponse,
  update: async (id: number, req: UpdateSpecialistTypeRequest): Promise<SpecialistTypeResponse> => (await generated.update(id, req)).data as SpecialistTypeResponse,
  delete: async (id: number): Promise<void> => { await generated._delete(id); },
};
