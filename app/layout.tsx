import { Provider } from "../components/ui/provider";
import { QueryProvider } from "@/lib/providers";

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <Provider>{children}</Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
