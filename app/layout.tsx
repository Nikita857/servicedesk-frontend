import { Provider } from "../components/ui/provider";
import { QueryProvider } from "@/lib/providers";
import { AuthRefresh } from "@/lib/providers/AuthRefresh";

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
