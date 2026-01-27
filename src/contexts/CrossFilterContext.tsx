import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface CrossFilter {
  sourceVisualId: string;
  dimension: string;
  value: string | string[];
}

interface CrossFilterContextType {
  crossFilter: CrossFilter | null;
  setCrossFilter: (filter: CrossFilter | null) => void;
  clearCrossFilter: () => void;
  isFiltered: (visualId: string) => boolean;
  getHighlightedValue: (dimension: string) => string | string[] | null;
}

const CrossFilterContext = createContext<CrossFilterContextType | undefined>(undefined);

interface CrossFilterProviderProps {
  children: ReactNode;
}

export function CrossFilterProvider({ children }: CrossFilterProviderProps) {
  const [crossFilter, setCrossFilterState] = useState<CrossFilter | null>(null);

  const setCrossFilter = useCallback((filter: CrossFilter | null) => {
    // Toggle off if clicking the same value
    if (
      crossFilter &&
      filter &&
      crossFilter.sourceVisualId === filter.sourceVisualId &&
      crossFilter.dimension === filter.dimension &&
      JSON.stringify(crossFilter.value) === JSON.stringify(filter.value)
    ) {
      setCrossFilterState(null);
    } else {
      setCrossFilterState(filter);
    }
  }, [crossFilter]);

  const clearCrossFilter = useCallback(() => {
    setCrossFilterState(null);
  }, []);

  const isFiltered = useCallback(
    (visualId: string) => {
      return crossFilter !== null && crossFilter.sourceVisualId !== visualId;
    },
    [crossFilter]
  );

  const getHighlightedValue = useCallback(
    (dimension: string) => {
      if (!crossFilter || crossFilter.dimension !== dimension) {
        return null;
      }
      return crossFilter.value;
    },
    [crossFilter]
  );

  return (
    <CrossFilterContext.Provider
      value={{
        crossFilter,
        setCrossFilter,
        clearCrossFilter,
        isFiltered,
        getHighlightedValue,
      }}
    >
      {children}
    </CrossFilterContext.Provider>
  );
}

export function useCrossFilter() {
  const context = useContext(CrossFilterContext);
  if (context === undefined) {
    throw new Error("useCrossFilter must be used within a CrossFilterProvider");
  }
  return context;
}
