import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { SpecialistTypeResponse } from "@/types/support-line";
import type { CreateSpecialistTypeRequest, UpdateSpecialistTypeRequest } from "@/types/rbac";

export const specialistTypeApi = {
  getAll: async (): Promise<SpecialistTypeResponse[]> => {
    const response = await api.get<ApiResponse<SpecialistTypeResponse[]>>(
      "/specialist-types",
    );
    return response.data.data;
  },

  create: async (req: CreateSpecialistTypeRequest): Promise<SpecialistTypeResponse> => {
    const response = await api.post<ApiResponse<SpecialistTypeResponse>>("/specialist-types", req);
    return response.data.data;
  },

  update: async (id: number, req: UpdateSpecialistTypeRequest): Promise<SpecialistTypeResponse> => {
    const response = await api.put<ApiResponse<SpecialistTypeResponse>>(`/specialist-types/${id}`, req);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/specialist-types/${id}`);
  },
};
