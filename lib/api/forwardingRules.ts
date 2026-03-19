import api from "./client";
import type { ApiResponse } from "@/types/api";

export interface ForwardingRuleResponse {
  id: number;
  sourceRole: string;
  targetRole: string;
  enabled: boolean;
}

export interface RuleUpdate {
  sourceRole: string;
  targetRole: string;
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
