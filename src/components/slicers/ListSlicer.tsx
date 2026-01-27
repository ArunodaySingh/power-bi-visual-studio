import { useState, useMemo } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SlicerData } from "@/types/dashboard";
import { SlicerBase } from "./SlicerBase";

interface ListSlicerProps {
  slicer: SlicerData;
  availableValues: (string | number)[];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlicerData>) => void;
  onDelete: () => void;
}

export function ListSlicer({
  slicer,
  availableValues,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ListSlicerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const uniqueValues = useMemo(() => {
    const unique = [...new Set(availableValues)].filter((v) => v !== null && v !== undefined);
    return unique.sort((a, b) => String(a).localeCompare(String(b)));
  }, [availableValues]);

  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues;
    return uniqueValues.filter((v) =>
      String(v).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueValues, searchTerm]);

  const handleToggleValue = (value: string | number) => {
    const currentValues = slicer.selectedValues;
    const newValues = slicer.multiSelect !== false
      ? currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      : currentValues.includes(value)
      ? []
      : [value];
    
    onUpdate({ selectedValues: newValues });
  };

  const handleClear = () => {
    onUpdate({ selectedValues: [] });
    setSearchTerm("");
  };

  const handleSelectAll = () => {
    onUpdate({ selectedValues: [...uniqueValues] });
  };

  return (
    <SlicerBase
      slicer={slicer}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClear={handleClear}
    >
      <div className="space-y-2">
        {slicer.showSearch !== false && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        )}

        <ScrollArea className="h-[calc(100%-40px)] max-h-[200px] rounded-md border">
          <div className="p-1">
            {/* Select All option */}
            {slicer.multiSelect !== false && filteredValues.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground border-b mb-1"
              >
                <span className="font-medium text-muted-foreground">Select All</span>
              </button>
            )}
            
            {filteredValues.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {searchTerm ? "No matches found" : "No values available"}
              </div>
            ) : (
              filteredValues.map((value) => (
                <button
                  key={String(value)}
                  onClick={() => handleToggleValue(value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    slicer.selectedValues.includes(value) && "bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      slicer.selectedValues.includes(value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
                    )}
                  >
                    {slicer.selectedValues.includes(value) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  <span className="truncate">{String(value)}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </SlicerBase>
  );
}
