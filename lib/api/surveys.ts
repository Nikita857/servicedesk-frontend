import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  CreateSurveyRequest,
  MySurveyResponse,
  SubmitSurveyAnswersRequest,
  SurveyDetailResponse,
  SurveyManagementResponse,
} from "@/types/survey";

export const surveysApi = {
  create: async (request: CreateSurveyRequest): Promise<SurveyManagementResponse> => {
    const response = await api.post<ApiResponse<SurveyManagementResponse>>("/surveys", request);
    return response.data.data;
  },

  list: async (page: number = 0, size: number = 20): Promise<PaginatedResponse<SurveyManagementResponse>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<SurveyManagementResponse>>>("/surveys", {
      params: { page, size },
    });
    return response.data.data;
  },

  getMy: async (): Promise<MySurveyResponse[]> => {
    const response = await api.get<ApiResponse<MySurveyResponse[]>>("/surveys/my");
    return response.data.data;
  },

  getById: async (id: number): Promise<SurveyDetailResponse> => {
    const response = await api.get<ApiResponse<SurveyDetailResponse>>(`/surveys/${id}`);
    return response.data.data;
  },

  submitResponses: async (id: number, request: SubmitSurveyAnswersRequest): Promise<void> => {
    await api.post<ApiResponse<void>>(`/surveys/${id}/responses`, request);
  },

  close: async (id: number): Promise<void> => {
    await api.post<ApiResponse<void>>(`/surveys/${id}/close`);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/surveys/${id}`);
  },
};
