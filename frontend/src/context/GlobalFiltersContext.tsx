import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface GlobalFilters {
  mes?: string;
  ano?: string;
  tipoMaterial?: string;
  centro?: string;
}

interface GlobalFiltersContextValue {
  globalFilters: GlobalFilters;
  setGlobalFilters: (f: GlobalFilters) => void;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextValue | undefined>(undefined);

export function GlobalFiltersProvider({ children }: { children: ReactNode }) {
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({});
  return (
    <GlobalFiltersContext.Provider value={{ globalFilters, setGlobalFilters }}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}

export function useGlobalFilters() {
  const ctx = useContext(GlobalFiltersContext);
  if (!ctx) throw new Error("useGlobalFilters precisa estar dentro de um GlobalFiltersProvider");
  return ctx;
}
