import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";
import type { CreateAnnouncementRequest } from "@/types/announcement";
import { handleApiError, toast } from "@/lib/utils";

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAnnouncementRequest) => announcementsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success("Успех", "Объявление создано и отправлено получателям");
    },
    onError: (error) => handleApiError(error, { context: "создать объявление" }),
  });
}
