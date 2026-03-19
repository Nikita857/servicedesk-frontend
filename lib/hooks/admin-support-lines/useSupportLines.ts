import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { supportLineApi } from "@/lib/api/supportLines";
import { handleApiError, toast } from "@/lib/utils";
import type { CreateSupportLineRequest } from "@/types/support-line";

/**
 * Hook for fetching all support lines for admin management.
 */
export function useSupportLines() {
  const query = useQuery({
    queryKey: ["support-lines"],
    queryFn: supportLineApi.list,
    staleTime: 30 * 1000,
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (data: CreateSupportLineRequest) => supportLineApi.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Линия создана");
      router.push(`/dashboard/admin/support-lines/${created.id}`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  return {
    lines: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createLine: (data: CreateSupportLineRequest) => createMutation.mutate(data),
    isCreating: createMutation.isPending,
  };
}
