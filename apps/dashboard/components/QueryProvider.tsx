"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";

// TanStack Query client (MASTER_SPEC §12): replaces the hand-rolled setInterval pollers with cached,
// deduped, error-aware fetching that pauses on hidden tabs. Realtime cache invalidation (Supabase)
// layers on later; until then queries use a short refetchInterval as a drop-in for the old polling.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2_000,
            refetchOnWindowFocus: true,
            refetchIntervalInBackground: false, // don't poll hidden tabs (fixes the old background waste)
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}
