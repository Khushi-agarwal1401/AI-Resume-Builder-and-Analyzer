"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface DashboardSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
}

const DashboardSearchContext = createContext<DashboardSearchContextValue>({
  query: "",
  setQuery: () => {},
});

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  return (
    <DashboardSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}
