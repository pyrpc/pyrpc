"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/pyrpc";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider>{children}</api.Provider>
    </QueryClientProvider>
  );
}
