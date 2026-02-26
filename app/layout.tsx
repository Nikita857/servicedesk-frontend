import { Provider } from "@/components/ui";
import { QueryProvider } from "@/lib/providers";
import { AuthRefresh } from "@/lib/providers/AuthRefresh";
import React from "react";

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <html lang="ru">
      <body>
        <QueryProvider>
          <Provider>
            <AuthRefresh />
            {children}
          </Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
