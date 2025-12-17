"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Стандартные настройки для всех запросов
            staleTime: 1000 * 60, // 1 минута - данные считаются свежими
            gcTime: 1000 * 60 * 5, // 5 минут - время хранения в кэше
            retry: 1, // Одна попытка повтора при ошибке
            refetchOnWindowFocus: false, // Не рефетчить при фокусе окна
          },
          mutations: {
            retry: 0, // Не повторять мутации
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
