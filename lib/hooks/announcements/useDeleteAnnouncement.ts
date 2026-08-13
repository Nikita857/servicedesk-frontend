import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";
import { handleApiError, toast } from "@/lib/utils";

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => announcementsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success("Успех", "Объявление удалено");
    },
    onError: (error) => handleApiError(error, { context: "удалить объявление" }),
  });
}
