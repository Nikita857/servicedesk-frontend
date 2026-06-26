import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  forwardingRulesApi,
  type ForwardingRuleResponse,
  type RuleUpdate,
} from "@/lib/api/forwardingRules";
import { specialistTypeApi } from "@/lib/api/specialistTypes";
import type { SpecialistTypeResponse } from "@/types/support-line";
import { handleApiError, toast } from "@/lib/utils";

export type RuleMatrix = Record<string, Record<string, boolean>>;

function buildMatrix(
  rules: ForwardingRuleResponse[],
  types: SpecialistTypeResponse[],
): RuleMatrix {
  const codes = types.map((t) => t.code);
  const matrix: RuleMatrix = {};
  for (const src of codes) {
    matrix[src] = {};
    for (const tgt of codes) {
      matrix[src][tgt] = false;
    }
  }
  for (const rule of rules) {
    const src = rule.sourceRole?.code;
    const tgt = rule.targetRole?.code;
    if (src && tgt && matrix[src] !== undefined) {
      matrix[src][tgt] = rule.enabled;
    }
  }
  return matrix;
}

function matrixToUpdates(
  matrix: RuleMatrix,
  types: SpecialistTypeResponse[],
): RuleUpdate[] {
  const codes = types.map((t) => t.code);
  const updates: RuleUpdate[] = [];
  for (const src of codes) {
    for (const tgt of codes) {
      updates.push({
        sourceType: src,
        targetType: tgt,
        enabled: matrix[src]?.[tgt] ?? false,
      });
    }
  }
  return updates;
}

export function useForwardingRules() {
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState<RuleMatrix>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: specialistTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["specialist-types"],
    queryFn: specialistTypeApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rules, isLoading: isLoadingRules } = useQuery({
    queryKey: ["forwarding-rules"],
    queryFn: forwardingRulesApi.getAll,
    staleTime: 60 * 1000,
  });

  const activeTypes = specialistTypes.filter((t) => t.active);

  // Инициализация матрицы один раз, когда подгрузились правила и типы (render-time).
  if (rules && activeTypes.length > 0 && !isInitialized) {
    setMatrix(buildMatrix(rules, activeTypes));
    setIsInitialized(true);
  }

  const toggleRule = useCallback((sourceCode: string, targetCode: string) => {
    setMatrix((prev) => ({
      ...prev,
      [sourceCode]: {
        ...prev[sourceCode],
        [targetCode]: !prev[sourceCode]?.[targetCode],
      },
    }));
    setIsDirty(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: () =>
      forwardingRulesApi.update(matrixToUpdates(matrix, activeTypes)),
    onSuccess: (data) => {
      queryClient.setQueryData(["forwarding-rules"], data);
      setMatrix(buildMatrix(data, activeTypes));
      setIsDirty(false);
      toast.success("Правила маршрутизации сохранены");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const resetMatrix = useCallback(() => {
    if (rules) {
      setMatrix(buildMatrix(rules, activeTypes));
      setIsDirty(false);
    }
  }, [rules, activeTypes]);

  return {
    matrix,
    specialistTypes: activeTypes,
    isLoading: isLoadingTypes || isLoadingRules,
    isDirty,
    isSaving: saveMutation.isPending,
    toggleRule,
    save: () => saveMutation.mutate(),
    reset: resetMatrix,
  };
}
