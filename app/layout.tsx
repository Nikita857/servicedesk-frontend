import { Manrope } from "next/font/google";
import { Provider } from "@/components/ui";
import { QueryProvider } from "@/lib/providers";
import { AuthRefresh } from "@/lib/providers/AuthRefresh";
import { MaintenanceGate } from "@/lib/providers/MaintenanceGate";
import React from "react";

/**
 * Manrope вместо системного шрифта: у системного стека кириллица на Windows
 * отдаётся Segoe UI, и интерфейс выглядел по-разному на разных машинах.
 * Подключаем через next/font — файлы уезжают в бандл, внешних запросов к Google нет.
 */
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <QueryProvider>
          <Provider>
            <AuthRefresh />
            <MaintenanceGate>{children}</MaintenanceGate>
          </Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
