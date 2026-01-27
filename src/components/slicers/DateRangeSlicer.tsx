import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SlicerData } from "@/types/dashboard";
import { SlicerBase } from "./SlicerBase";

interface DateRangeSlicerProps {
  slicer: SlicerData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlicerData>) => void;
  onDelete: () => void;
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  dateRange: { start: Date | null; end: Date | null };
}

type PresetOption = {
  label: string;
  value: string;
  getRange: () => { start: Date; end: Date };
};

const presetOptions: PresetOption[] = [
  {
    label: "Today",
    value: "today",
    getRange: () => {
      const now = new Date();
      return { start: now, end: now };
    },
  },
  {
    label: "Last 7 days",
    value: "last7",
    getRange: () => ({
      start: subDays(new Date(), 7),
      end: new Date(),
    }),
  },
  {
    label: "Last 30 days",
    value: "last30",
    getRange: () => ({
      start: subDays(new Date(), 30),
      end: new Date(),
    }),
  },
  {
    label: "This month",
    value: "thisMonth",
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    value: "lastMonth",
    getRange: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "This year",
    value: "thisYear",
    getRange: () => ({
      start: startOfYear(new Date()),
      end: new Date(),
    }),
  },
];

export function DateRangeSlicer({
  slicer,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDateRangeChange,
  dateRange,
}: DateRangeSlicerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const handlePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    const preset = presetOptions.find((p) => p.value === presetValue);
    if (preset) {
      onDateRangeChange(preset.getRange());
    }
  };

  const handleDateSelect = (date: Date | undefined, type: "start" | "end") => {
    if (date) {
      setSelectedPreset(""); // Clear preset when manually selecting
      onDateRangeChange({
        start: type === "start" ? date : dateRange.start,
        end: type === "end" ? date : dateRange.end,
      });
    }
  };

  const handleClear = () => {
    setSelectedPreset("");
    onDateRangeChange({ start: null, end: null });
    onUpdate({ selectedValues: [] });
  };

  const displayText = useMemo(() => {
    if (!dateRange.start && !dateRange.end) {
      return "Select date range";
    }
    const startStr = dateRange.start ? format(dateRange.start, "MMM d, yyyy") : "...";
    const endStr = dateRange.end ? format(dateRange.end, "MMM d, yyyy") : "...";
    return `${startStr} - ${endStr}`;
  }, [dateRange]);

  const hasSelection = dateRange.start !== null || dateRange.end !== null;

  return (
    <SlicerBase
      slicer={{ ...slicer, selectedValues: hasSelection ? ["range"] : [] }}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClear={handleClear}
    >
      <div className="space-y-2">
        {/* Preset Selector */}
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Quick select..." />
          </SelectTrigger>
          <SelectContent className="z-50">
            {presetOptions.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom Date Range */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal text-xs h-8",
                  !dateRange.start && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dateRange.start ? format(dateRange.start, "MMM d") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={dateRange.start || undefined}
                onSelect={(date) => handleDateSelect(date, "start")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal text-xs h-8",
                  !dateRange.end && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dateRange.end ? format(dateRange.end, "MMM d") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={dateRange.end || undefined}
                onSelect={(date) => handleDateSelect(date, "end")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Display Selected Range */}
        {hasSelection && (
          <div className="text-xs text-muted-foreground text-center py-1 bg-muted/50 rounded">
            {displayText}
          </div>
        )}
      </div>
    </SlicerBase>
  );
}
