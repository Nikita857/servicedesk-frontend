import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { SpecialistTypeResponse } from "@/types/support-line";

export const specialistTypeApi = {
  getAll: async (): Promise<SpecialistTypeResponse[]> => {
    const response = await api.get<ApiResponse<SpecialistTypeResponse[]>>(
      "/specialist-types",
    );
    return response.data.data;
  },
};
