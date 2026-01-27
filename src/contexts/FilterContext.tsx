import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { FilterValue, SlicerData } from "@/types/dashboard";

interface FilterContextType {
  filters: FilterValue[];
  slicers: SlicerData[];
  addFilter: (filter: FilterValue) => void;
  removeFilter: (field: string) => void;
  updateFilter: (field: string, values: (string | number)[]) => void;
  clearFilters: () => void;
  addSlicer: (slicer: SlicerData) => void;
  updateSlicer: (id: string, updates: Partial<SlicerData>) => void;
  removeSlicer: (id: string) => void;
  getFilteredData: <T extends Record<string, unknown>>(data: T[]) => T[];
}

const FilterContext = createContext<FilterContextType | null>(null);

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

interface FilterProviderProps {
  children: React.ReactNode;
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [slicers, setSlicers] = useState<SlicerData[]>([]);

  const addFilter = useCallback((filter: FilterValue) => {
    setFilters((prev) => {
      const existing = prev.findIndex((f) => f.field === filter.field);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = filter;
        return updated;
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  }, []);

  const updateFilter = useCallback((field: string, values: (string | number)[]) => {
    setFilters((prev) => {
      const existing = prev.findIndex((f) => f.field === field);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], values };
        return updated;
      }
      return [...prev, { field, values, operator: "equals" }];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setSlicers((prev) => prev.map((s) => ({ ...s, selectedValues: [] })));
  }, []);

  const addSlicer = useCallback((slicer: SlicerData) => {
    setSlicers((prev) => [...prev, slicer]);
  }, []);

  const updateSlicer = useCallback((id: string, updates: Partial<SlicerData>) => {
    setSlicers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    
    // If selectedValues changed, update the corresponding filter
    if (updates.selectedValues !== undefined) {
      const slicer = slicers.find((s) => s.id === id);
      if (slicer) {
        if (updates.selectedValues.length > 0) {
          addFilter({
            field: slicer.field,
            values: updates.selectedValues,
            operator: "equals",
          });
        } else {
          removeFilter(slicer.field);
        }
      }
    }
  }, [slicers, addFilter, removeFilter]);

  const removeSlicer = useCallback((id: string) => {
    const slicer = slicers.find((s) => s.id === id);
    if (slicer) {
      removeFilter(slicer.field);
    }
    setSlicers((prev) => prev.filter((s) => s.id !== id));
  }, [slicers, removeFilter]);

  const getFilteredData = useCallback(<T extends Record<string, unknown>>(data: T[]): T[] => {
    if (filters.length === 0) return data;

    return data.filter((item) => {
      return filters.every((filter) => {
        const value = item[filter.field];
        
        if (filter.values.length === 0 && !filter.numericRange && !filter.dateRange) return true;

        switch (filter.operator) {
          case "equals":
            if (filter.values.length === 0) return true;
            return filter.values.includes(value as string | number);
          case "contains":
            if (filter.values.length === 0) return true;
            return filter.values.some((v) =>
              String(value).toLowerCase().includes(String(v).toLowerCase())
            );
          case "gt":
            return Number(value) > Number(filter.values[0]);
          case "lt":
            return Number(value) < Number(filter.values[0]);
          case "gte":
            return Number(value) >= Number(filter.values[0]);
          case "lte":
            return Number(value) <= Number(filter.values[0]);
          case "between":
            if (filter.numericRange) {
              const num = Number(value);
              return num >= filter.numericRange.min && num <= filter.numericRange.max;
            }
            return true;
          default:
            if (filter.values.length === 0) return true;
            return filter.values.includes(value as string | number);
        }
      });
    });
  }, [filters]);

  const value = useMemo(
    () => ({
      filters,
      slicers,
      addFilter,
      removeFilter,
      updateFilter,
      clearFilters,
      addSlicer,
      updateSlicer,
      removeSlicer,
      getFilteredData,
    }),
    [filters, slicers, addFilter, removeFilter, updateFilter, clearFilters, addSlicer, updateSlicer, removeSlicer, getFilteredData]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
