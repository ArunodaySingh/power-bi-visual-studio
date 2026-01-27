import { useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SlicerData } from "@/types/dashboard";
import { SlicerBase } from "./SlicerBase";

interface DropdownSlicerProps {
  slicer: SlicerData;
  availableValues: (string | number)[];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlicerData>) => void;
  onDelete: () => void;
}

export function DropdownSlicer({
  slicer,
  availableValues,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: DropdownSlicerProps) {
  const uniqueValues = useMemo(() => {
    const unique = [...new Set(availableValues)].filter((v) => v !== null && v !== undefined);
    return unique.sort((a, b) => String(a).localeCompare(String(b)));
  }, [availableValues]);

  const handleToggleValue = (value: string | number) => {
    const currentValues = slicer.selectedValues;
    const newValues = slicer.multiSelect
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
  };

  const displayText = useMemo(() => {
    if (slicer.selectedValues.length === 0) {
      return "Select...";
    }
    if (slicer.selectedValues.length === 1) {
      return String(slicer.selectedValues[0]);
    }
    return `${slicer.selectedValues.length} selected`;
  }, [slicer.selectedValues]);

  return (
    <SlicerBase
      slicer={slicer}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClear={handleClear}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between text-sm h-9"
          >
            <span className="truncate">{displayText}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[200px] p-0 z-50" align="start">
          <ScrollArea className="max-h-[300px]">
            <div className="p-1">
              {uniqueValues.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No values available
                </div>
              ) : (
                uniqueValues.map((value) => (
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
        </PopoverContent>
      </Popover>
    </SlicerBase>
  );
}
