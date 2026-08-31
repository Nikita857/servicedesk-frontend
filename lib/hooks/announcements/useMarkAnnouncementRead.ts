import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";
import { handleApiError } from "@/lib/utils";

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => announcementsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
    onError: (error) => handleApiError(error, { context: "отметить объявление прочитанным" }),
  });
}
