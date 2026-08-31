import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";
import { handleApiError, toast } from "@/lib/utils";

export function useArchiveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => announcementsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success("Успех", "Объявление заархивировано");
    },
    onError: (error) => handleApiError(error, { context: "заархивировать объявление" }),
  });
}
