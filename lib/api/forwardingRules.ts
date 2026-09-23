import type { ForwardingRuleResponse, RuleUpdate } from './generated/models';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();
export type { ForwardingRuleResponse, RuleUpdate };

export const forwardingRulesApi = {
  getAll: async (): Promise<ForwardingRuleResponse[]> => (await generated.getAllRules()).data as ForwardingRuleResponse[],
  update: async (rules: RuleUpdate[]): Promise<ForwardingRuleResponse[]> => (await generated.updateRules({ rules })).data as ForwardingRuleResponse[],
};
