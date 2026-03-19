import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  forwardingRulesApi,
  type ForwardingRuleResponse,
  type RuleUpdate,
} from "@/lib/api/forwardingRules";
import { handleApiError, toast } from "@/lib/utils";

// Роли-источники (строки матрицы) — специалисты и пользователи
const SOURCE_ROLES = [
  "USER",
  "SYSADMIN",
  "ONE_C_SUPPORT",
  "DEV1C",
  "DEVELOPER",
] as const;

// Роли-получатели (столбцы матрицы) — только специалистические
const TARGET_ROLES = [
  "SYSADMIN",
  "ONE_C_SUPPORT",
  "DEV1C",
  "DEVELOPER",
] as const;

export type RuleMatrix = Record<string, Record<string, boolean>>;

function buildMatrix(rules: ForwardingRuleResponse[]): RuleMatrix {
  const matrix: RuleMatrix = {};
  for (const src of SOURCE_ROLES) {
    matrix[src] = {};
    for (const tgt of TARGET_ROLES) {
      matrix[src][tgt] = false;
    }
  }
  for (const rule of rules) {
    if (matrix[rule.sourceRole]?.[rule.targetRole] !== undefined) {
      matrix[rule.sourceRole][rule.targetRole] = rule.enabled;
    }
  }
  return matrix;
}

function matrixToUpdates(matrix: RuleMatrix): RuleUpdate[] {
  const updates: RuleUpdate[] = [];
  for (const src of SOURCE_ROLES) {
    for (const tgt of TARGET_ROLES) {
      updates.push({
        sourceRole: src,
        targetRole: tgt,
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

  const { data: rules, isLoading } = useQuery({
    queryKey: ["forwarding-rules"],
    queryFn: forwardingRulesApi.getAll,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (rules && !isInitialized) {
      setMatrix(buildMatrix(rules));
      setIsInitialized(true);
    }
  }, [rules, isInitialized]);

  const toggleRule = useCallback(
    (sourceRole: string, targetRole: string) => {
      setMatrix((prev) => ({
        ...prev,
        [sourceRole]: {
          ...prev[sourceRole],
          [targetRole]: !prev[sourceRole]?.[targetRole],
        },
      }));
      setIsDirty(true);
    },
    []
  );

  const saveMutation = useMutation({
    mutationFn: () => forwardingRulesApi.update(matrixToUpdates(matrix)),
    onSuccess: (data) => {
      queryClient.setQueryData(["forwarding-rules"], data);
      setMatrix(buildMatrix(data));
      setIsDirty(false);
      toast.success("Правила маршрутизации сохранены");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const resetMatrix = useCallback(() => {
    if (rules) {
      setMatrix(buildMatrix(rules));
      setIsDirty(false);
    }
  }, [rules]);

  return {
    matrix,
    isLoading,
    isDirty,
    isSaving: saveMutation.isPending,
    toggleRule,
    save: () => saveMutation.mutate(),
    reset: resetMatrix,
    SOURCE_ROLES,
    TARGET_ROLES,
  };
}
