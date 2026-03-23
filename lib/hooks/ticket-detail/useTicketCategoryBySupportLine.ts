import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ticketApi} from "@/lib/api";
import {queryKeys} from "@/lib/queryKeys";
import {handleApiError, toast} from "@/lib/utils";

export function useTicketCategoryBySupportLine(ticketId: number) {

    const queryClient = useQueryClient();

    const setTicketCategory = useMutation({
        mutationFn: (categoryId: number) => ticketApi.setSupportCategory(ticketId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: queryKeys.tickets.detail(ticketId)}),
            toast.success("Категория поддержки установлена")
        },
        onError: () => handleApiError("Не удалось установить категорию поддержки")
    });

    return { setTicketCategory }
}
