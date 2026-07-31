"use client";

import { SessionProvider } from "next-auth/react";
import { DashboardSearchProvider } from "@/features/dashboard/context/DashboardSearchContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardSearchProvider>{children}</DashboardSearchProvider>
    </SessionProvider>
  );
}
