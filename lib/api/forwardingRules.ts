import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { SpecialistTypeResponse } from "@/types/support-line";

export interface ForwardingRuleResponse {
  id: number;
  sourceRole: SpecialistTypeResponse;
  targetRole: SpecialistTypeResponse;
  enabled: boolean;
}

export interface RuleUpdate {
  sourceType: string;
  targetType: string;
  enabled: boolean;
}

export const forwardingRulesApi = {
  getAll: async (): Promise<ForwardingRuleResponse[]> => {
    const response = await api.get<ApiResponse<ForwardingRuleResponse[]>>(
      "/admin/forwarding-rules"
    );
    return response.data.data;
  },

  update: async (rules: RuleUpdate[]): Promise<ForwardingRuleResponse[]> => {
    const response = await api.put<ApiResponse<ForwardingRuleResponse[]>>(
      "/admin/forwarding-rules",
      { rules }
    );
    return response.data.data;
  },
};
