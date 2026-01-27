import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { SlicerData } from "@/types/dashboard";
import { SlicerBase } from "./SlicerBase";

interface NumericRangeSlicerProps {
  slicer: SlicerData;
  availableValues: number[];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SlicerData>) => void;
  onDelete: () => void;
  onRangeChange: (range: { min: number; max: number }) => void;
  range: { min: number; max: number };
}

export function NumericRangeSlicer({
  slicer,
  availableValues,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onRangeChange,
  range,
}: NumericRangeSlicerProps) {
  const { min: dataMin, max: dataMax } = useMemo(() => {
    if (availableValues.length === 0) return { min: 0, max: 100 };
    const numericValues = availableValues.filter((v) => typeof v === "number" && !isNaN(v));
    return {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    };
  }, [availableValues]);

  const [localMin, setLocalMin] = useState(range.min);
  const [localMax, setLocalMax] = useState(range.max);

  useEffect(() => {
    setLocalMin(range.min);
    setLocalMax(range.max);
  }, [range]);

  const handleSliderChange = (values: number[]) => {
    setLocalMin(values[0]);
    setLocalMax(values[1]);
    onRangeChange({ min: values[0], max: values[1] });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setLocalMin(value);
      if (value <= localMax) {
        onRangeChange({ min: value, max: localMax });
      }
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setLocalMax(value);
      if (value >= localMin) {
        onRangeChange({ min: localMin, max: value });
      }
    }
  };

  const handleClear = () => {
    setLocalMin(dataMin);
    setLocalMax(dataMax);
    onRangeChange({ min: dataMin, max: dataMax });
    onUpdate({ selectedValues: [] });
  };

  const hasSelection = localMin !== dataMin || localMax !== dataMax;

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <SlicerBase
      slicer={{ ...slicer, selectedValues: hasSelection ? [localMin, localMax] : [] }}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClear={handleClear}
    >
      <div className="space-y-4 px-1">
        {/* Slider */}
        <div className="pt-2">
          <Slider
            value={[localMin, localMax]}
            min={dataMin}
            max={dataMax}
            step={(dataMax - dataMin) / 100}
            onValueChange={handleSliderChange}
            className="cursor-pointer"
          />
        </div>

        {/* Min/Max Inputs */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Min</Label>
            <Input
              type="number"
              value={localMin}
              onChange={handleMinChange}
              className="h-8 text-sm"
              min={dataMin}
              max={localMax}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Max</Label>
            <Input
              type="number"
              value={localMax}
              onChange={handleMaxChange}
              className="h-8 text-sm"
              min={localMin}
              max={dataMax}
            />
          </div>
        </div>

        {/* Range Display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Data range: {formatValue(dataMin)} - {formatValue(dataMax)}</span>
        </div>
      </div>
    </SlicerBase>
  );
}
