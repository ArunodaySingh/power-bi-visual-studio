/**
 * SlicerSettingsPanel Component
 * 
 * Provides configuration UI for slicers based on their type:
 * - Dropdown: Field selection (Group By dimensions), multi-select toggle
 * - List: Same as Dropdown
 * - Date Range: Defaults to date field
 * - Numeric Range: Field selection (Measures only)
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Filter, Loader2 } from "lucide-react";
import { useMetaAdsSchema, getColumnDisplayName } from "@/hooks/useMetaAdsSchema";
import type { SlicerData } from "@/types/dashboard";

interface SlicerSettingsPanelProps {
  slicer: SlicerData;
  onUpdate: (updates: Partial<SlicerData>) => void;
}

export function SlicerSettingsPanel({ slicer, onUpdate }: SlicerSettingsPanelProps) {
  const { data: schema, isLoading } = useMetaAdsSchema();
  
  const isDropdownOrList = slicer.type === "dropdown" || slicer.type === "list";
  const isDateRange = slicer.type === "date-range";
  const isNumericRange = slicer.type === "numeric-range";
  
  // Dynamic measures and dimensions from database
  const metaMetrics = schema?.measures || [];
  const groupByDimensions = schema?.dimensions || [];

  const handleFieldChange = (value: string) => {
    onUpdate({ 
      field: value, 
      fieldLabel: value,
      title: value,
      selectedValues: [], // Reset selection when field changes
    });
  };

  const handleTitleChange = (value: string) => {
    onUpdate({ title: value });
  };

  const handleMultiSelectToggle = (checked: boolean) => {
    onUpdate({ 
      multiSelect: checked,
      selectedValues: checked ? slicer.selectedValues : slicer.selectedValues.slice(0, 1),
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading schema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Slicer Settings
        </h3>
      </div>

      {/* Slicer Type Display */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <div className="text-sm font-medium capitalize">
          {slicer.type.replace("-", " ")}
        </div>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Title
        </Label>
        <Input
          value={slicer.title || slicer.fieldLabel}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Slicer title..."
          className="h-8"
        />
      </div>

      {/* Field Selection - Different options based on slicer type */}
      {isDropdownOrList && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Field (Group By)
            </Label>
            <Select value={slicer.field} onValueChange={handleFieldChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a dimension..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
              {groupByDimensions.map((dimension) => (
                  <SelectItem key={dimension} value={dimension}>
                    {getColumnDisplayName(dimension)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="multiSelect" className="text-xs text-muted-foreground">
              Multi-Select
            </Label>
            <Switch
              id="multiSelect"
              checked={slicer.multiSelect !== false}
              onCheckedChange={handleMultiSelectToggle}
            />
          </div>
        </>
      )}

      {isDateRange && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Field
          </Label>
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            Date (default)
          </div>
          <p className="text-xs text-muted-foreground">
            Date range slicers always filter on the date field.
          </p>
        </div>
      )}

      {isNumericRange && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Field (Measure)
          </Label>
          <Select value={slicer.field} onValueChange={handleFieldChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a measure..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {metaMetrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {getColumnDisplayName(metric)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Selection Summary */}
      {slicer.selectedValues.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{slicer.selectedValues.length}</span> value(s) selected
          </p>
        </div>
      )}
    </div>
  );
}
