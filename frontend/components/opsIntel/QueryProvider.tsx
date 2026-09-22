import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Isolated to the Session Operations Intelligence prototype — created once per
// browser session (not per render) so cached queries survive navigation.
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
