import type { PaginatedResponse } from "@/types/api";
import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';
import type {
  CreateSurveyRequest,
  MySurveyResponse,
  SubmitSurveyAnswersRequest,
  SurveyDetailResponse,
  SurveyManagementResponse,
} from "@/types/survey";

const generated = getServiceDeskAPI();

export const surveysApi = {
  create: async (request: CreateSurveyRequest): Promise<SurveyManagementResponse> => {
    return (await generated.createSurvey(request)).data as SurveyManagementResponse;
  },

  list: async (page: number = 0, size: number = 20): Promise<PaginatedResponse<SurveyManagementResponse>> => {
    return toPage((await generated.getSurveys({ pageable: { page, size } })).data) as PaginatedResponse<SurveyManagementResponse>;
  },

  getMy: async (): Promise<MySurveyResponse[]> => {
    return (await generated.getMySurveys()).data as MySurveyResponse[];
  },

  getById: async (id: number): Promise<SurveyDetailResponse> => {
    return (await generated.getSurvey(id)).data as SurveyDetailResponse;
  },

  submitResponses: async (id: number, request: SubmitSurveyAnswersRequest): Promise<void> => {
    await generated.submitResponses(id, request);
  },

  close: async (id: number): Promise<void> => {
    await generated.closeSurvey(id);
  },

  remove: async (id: number): Promise<void> => {
    await generated.deleteSurvey(id);
  },
};
