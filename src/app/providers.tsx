"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { DashboardSearchProvider } from "@/features/dashboard/context/DashboardSearchContext";
import { createQueryClient } from "@/lib/query/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <DashboardSearchProvider>{children}</DashboardSearchProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
